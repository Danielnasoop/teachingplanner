// 전역 변수
let currentSchool = 'elementary';
let currentGrade = null;
let currentPlanId = null;
let editMode = false;
let passwordAction = null; // 'edit' or 'delete'

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    initializeTabs();
    initializeButtons();
    initializeModals();
    loadAllPlans();
});

// 모달 닫기
function closeModal(modal) {
    modal.classList.remove('active');

    // 폼 초기화
    if (modal.id === 'planModal') {
        document.getElementById('planForm').reset();
        editMode = false;
    } else if (modal.id === 'passwordModal') {
        document.getElementById('verifyPassword').value = '';
        passwordAction = null;
    }
}

// 탭 초기화
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');

    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 모든 탭 버튼과 섹션 비활성화
            tabButtons.forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.school-section').forEach(section => {
                section.classList.remove('active');
            });

            // 선택된 탭 활성화
            this.classList.add('active');
            const school = this.getAttribute('data-school');
            currentSchool = school;
            document.getElementById(school).classList.add('active');
        });
    });
}

// 버튼 이벤트 초기화
function initializeButtons() {
    const addButtons = document.querySelectorAll('.add-plan-btn');

    addButtons.forEach(button => {
        button.addEventListener('click', function() {
            const school = this.getAttribute('data-school');
            const grade = this.getAttribute('data-grade');
            openPlanModal(school, grade, false);
        });
    });
}

// 모달 초기화
function initializeModals() {
    const planModal = document.getElementById('planModal');
    const viewModal = document.getElementById('viewModal');
    const passwordModal = document.getElementById('passwordModal');
    const closeButtons = document.querySelectorAll('.close');

    // 닫기 버튼
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            closeModal(modal);
        });
    });

    // 모달 외부 클릭 시 닫기
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target);
        }
    });

    // 계획서 폼 제출
    document.getElementById('planForm').addEventListener('submit', function(e) {
        e.preventDefault();
        savePlan();
    });

    // 비밀번호 폼 제출
    document.getElementById('passwordForm').addEventListener('submit', function(e) {
        e.preventDefault();
        verifyPassword();
    });

    // 수정 버튼
    document.getElementById('editPlanBtn').addEventListener('click', function() {
        passwordAction = 'edit';
        document.getElementById('viewModal').classList.remove('active');
        document.getElementById('passwordModal').classList.add('active');
    });

    // 삭제 버튼
    document.getElementById('deletePlanBtn').addEventListener('click', function() {
        if (confirm('정말로 이 계획서를 삭제하시겠습니까?')) {
            passwordAction = 'delete';
            document.getElementById('viewModal').classList.remove('active');
            document.getElementById('passwordModal').classList.add('active');
        }
    });
}

// 계획서 작성 모달 열기
function openPlanModal(school, grade, isEdit = false) {
    currentSchool = school;
    currentGrade = grade;
    editMode = isEdit;

    const modal = document.getElementById('planModal');
    const modalTitle = document.getElementById('modalTitle');

    if (isEdit) {
        modalTitle.textContent = '수업 계획서 수정';
        // 기존 데이터 불러오기
        const plan = getPlanById(currentPlanId);
        if (plan) {
            document.getElementById('teacherName').value = plan.teacherName;
            document.getElementById('subject').value = plan.subject;
            document.getElementById('planTitle').value = plan.title;
            document.getElementById('planContent').value = plan.content;
            document.getElementById('password').value = '';
        }
    } else {
        modalTitle.textContent = '수업 계획서 작성';
        document.getElementById('planForm').reset();
    }

    modal.classList.add('active');
}

// 계획서 저장
function savePlan() {
    const teacherName = document.getElementById('teacherName').value.trim();
    const subject = document.getElementById('subject').value.trim();
    const title = document.getElementById('planTitle').value.trim();
    const content = document.getElementById('planContent').value.trim();
    const password = document.getElementById('password').value;

    if (!teacherName || !subject || !title || !content || !password) {
        alert('모든 항목을 입력해주세요.');
        return;
    }

    const plan = {
        id: editMode ? currentPlanId : generateId(),
        school: currentSchool,
        grade: parseInt(currentGrade),
        teacherName: teacherName,
        subject: subject,
        title: title,
        content: content,
        password: password,
        createdAt: editMode ? getPlanById(currentPlanId).createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    let plans = getPlans();

    if (editMode) {
        // 기존 계획서 수정
        const index = plans.findIndex(p => p.id === currentPlanId);
        if (index !== -1) {
            plans[index] = plan;
        }
    } else {
        // 새 계획서 추가
        plans.push(plan);
    }

    savePlans(plans);

    // 모달 닫기
    closeModal(document.getElementById('planModal'));

    // 화면 갱신
    loadAllPlans();

    alert(editMode ? '계획서가 수정되었습니다.' : '계획서가 저장되었습니다.');
}

// 계획서 보기
function viewPlan(planId) {
    currentPlanId = planId;
    const plan = getPlanById(planId);

    if (!plan) {
        alert('계획서를 찾을 수 없습니다.');
        return;
    }

    const detailsDiv = document.getElementById('planDetails');
    detailsDiv.innerHTML = `
        <h3>${escapeHtml(plan.title)}</h3>
        <div class="detail-item">
            <div class="detail-label">교사 이름</div>
            <div class="detail-content">${escapeHtml(plan.teacherName)}</div>
        </div>
        <div class="detail-item">
            <div class="detail-label">과목</div>
            <div class="detail-content">${escapeHtml(plan.subject)}</div>
        </div>
        <div class="detail-item">
            <div class="detail-label">계획서 내용</div>
            <div class="detail-content plan-content-display">${escapeHtml(plan.content)}</div>
        </div>
        <div class="detail-item">
            <div class="detail-label">작성일</div>
            <div class="detail-content">${formatDate(plan.createdAt)}</div>
        </div>
        <div class="detail-item">
            <div class="detail-label">최종 수정일</div>
            <div class="detail-content">${formatDate(plan.updatedAt)}</div>
        </div>
    `;

    document.getElementById('viewModal').classList.add('active');
}

// 비밀번호 확인
function verifyPassword() {
    const password = document.getElementById('verifyPassword').value;
    const plan = getPlanById(currentPlanId);

    if (!plan) {
        alert('계획서를 찾을 수 없습니다.');
        return;
    }

    if (plan.password !== password) {
        alert('비밀번호가 일치하지 않습니다.');
        return;
    }

    // 비밀번호 모달 닫기
    closeModal(document.getElementById('passwordModal'));

    // 동작 수행
    if (passwordAction === 'edit') {
        // 수정
        openPlanModal(plan.school, plan.grade, true);
    } else if (passwordAction === 'delete') {
        // 삭제
        deletePlan(currentPlanId);
    }
}

// 계획서 삭제
function deletePlan(planId) {
    let plans = getPlans();
    plans = plans.filter(p => p.id !== planId);
    savePlans(plans);
    loadAllPlans();
    alert('계획서가 삭제되었습니다.');
}

// 모든 계획서 로드
function loadAllPlans() {
    const schools = ['elementary', 'middle', 'high'];
    const grades = {
        'elementary': [1, 2, 3, 4, 5, 6],
        'middle': [1, 2, 3],
        'high': [1, 2, 3]
    };

    schools.forEach(school => {
        grades[school].forEach(grade => {
            loadPlansForGrade(school, grade);
        });
    });
}

// 특정 학년의 계획서 로드
function loadPlansForGrade(school, grade) {
    const plansList = document.getElementById(`${school}-${grade}-plans`);
    const plans = getPlans().filter(p => p.school === school && parseInt(p.grade) === parseInt(grade));

    plansList.innerHTML = '';

    if (plans.length === 0) {
        plansList.innerHTML = '<div class="empty-message">아직 작성된 계획서가 없습니다.</div>';
        return;
    }

    plans.forEach(plan => {
        const planItem = document.createElement('div');
        planItem.className = 'plan-item';
        planItem.innerHTML = `
            <h4>${escapeHtml(plan.title)}</h4>
            <p>${escapeHtml(plan.subject)} - ${escapeHtml(plan.teacherName)}</p>
            <div class="plan-meta">
                <span>작성: ${formatDate(plan.createdAt)}</span>
                <span>수정: ${formatDate(plan.updatedAt)}</span>
            </div>
        `;
        planItem.addEventListener('click', () => viewPlan(plan.id));
        plansList.appendChild(planItem);
    });
}

// localStorage에서 계획서 가져오기
function getPlans() {
    const plans = localStorage.getItem('schoolPlans');
    return plans ? JSON.parse(plans) : [];
}

// localStorage에 계획서 저장
function savePlans(plans) {
    localStorage.setItem('schoolPlans', JSON.stringify(plans));
}

// ID로 계획서 찾기
function getPlanById(id) {
    const plans = getPlans();
    return plans.find(p => p.id === id);
}

// 고유 ID 생성
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 날짜 포맷팅
function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// HTML 이스케이프 처리 (XSS 방지)
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
