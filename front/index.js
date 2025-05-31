// ✅ 초기 범위: 2025년 1월 ~ 12월 설정, 카드 없어도 렌더링 보장
let targetColumn = null;
let ganttCards = []; // Gantt 차트에 표시할 카드 데이터 배열
let ganttStartDate = new Date(2025, 0, 1);
let ganttEndDate = new Date(2025, 11, 31);
const GANTT_INIT_MONTHS = 12; // 초기 12개월(1년) 범위
// 전역 변수로 currentDate 선언 및 초기화
let currentDate = new Date();

$(document).ready(function () {
  loadDocumentList();
  const $modal = $('#modal');
  const $detailModal = $('#detail-modal');

  url = new URL(window.location.href);
  params = new URLSearchParams(window.location.search);
  
  // 로그인 버튼
  $('.login-btn').on('click', function () {
    window.location.href = `http://localhost:3000/login?${params}`;
  });

  // 초대하기 버튼 클릭 시 초대 모달 표시
  $('.top-buttons button:contains("초대하기")').click(function () {
    $('#invite-modal').show();
  });

  // 초대 모달 닫기 버튼
  $('#invite-close').click(function () {
    $('#invite-modal').hide();
    $('#invite-email').val('');
  });

  // 초대 확인 버튼 클릭 시 처리
  $('#invite-confirm').click(function () {
    params = new URLSearchParams(window.location.search);
    pageId = params.get("page");

    const email = $('#invite-email').val().trim();

    if (!email) {
      alert('이메일을 입력해주세요.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('올바른 이메일 주소를 입력해주세요.');
      return;
    }

    $.ajax({
      url: 'http://localhost:3030/api/invite',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ 
        email: email,
        page: pageId
       }),
      xhrFields: {
        withCredentials: true
      },
      success: function () {
        alert('초대 이메일이 전송되었습니다.');
        $('#invite-modal').hide();
        $('#invite-email').val('');
      },
      error: function () {
        alert('초대 요청에 실패했습니다. 다시 시도해주세요.');
      }
    });
  });

  $('.google-login').on('click', function () {
    $.ajax({
      url: 'http://localhost:3030/login/oauth2/google',
      method: 'GET',
      xhrFields: {
        withCredentials: true
      },
      success: function (response) {
        const auth = response.authorization;
        const loginUrl =
          `${auth.authorizationEndpoint}?` +
          `client_id=${encodeURIComponent(auth.clientId)}` +
          `&redirect_uri=${encodeURIComponent(auth.redirectUrl)}` +
          `&response_type=${encodeURIComponent(auth.responseType)}` +
          `&scope=${encodeURIComponent(auth.scope)}` +
          `&state=${encodeURIComponent(auth.state)}` +
          `&prompt=consent`;

        window.location.href = loginUrl;
      },
      error: function (error) {
        console.error('로그인 요청 실패:', error);
      }
    });
  });

  $('.github-login').on('click', function () {
    $.ajax({
      url: 'http://localhost:3030/login/oauth2/github',
      method: 'GET',
      xhrFields: {
        withCredentials: true
      },
      success: function (response) {
        const state = JSON.stringify({ 
          is_invite: params.has("invite"),
          invite_code: params.get("invite"),
          redirect_uri: "http://localhost:3000/index"
          // 로그인: http://localhost:3000/login
          // 초대 url: http://localhost:3000/index?page={page}&invite=asdsadsad
         });

         if (params.get("page")) redirect_uri + `?${page}`;
        
        const auth = response.authorization;
        const loginUrl =
          `${auth.authorizationEndpoint}?` +
          `client_id=${encodeURIComponent(auth.clientId)}` +
          `&redirect_uri=${encodeURIComponent(auth.redirectUrl)}` +
          `&response_type=${encodeURIComponent(auth.responseType)}` +
          `&scope=${encodeURIComponent(auth.scope)}` +
          `&state=${btoa(state)}` +
          `&prompt=consent`;
        
        window.location.href = loginUrl;
      },
      error: function (error) {
        console.error('로그인 요청 실패:', error);
      }
    });
  });

  $(document).on('click', '.add-btn', function (e) {
    if (!$('body').hasClass('logged-in')) {
      alert("로그인 후 사용할 수 있습니다.");
      return;
    }

    targetColumn = $(this).closest('.column').find('.card-list');
    $modal.show();
  });

  $('#modal-close').on('click', function () {
    $modal.hide();
    clearModalInputs();
  });

  $('#detail-close').on('click', function () {
    $detailModal.hide();
  });

  $('#add-card-confirm').off('click').on('click', function () {
    const name = $('#task-name').val().trim();
    const owner = $('#task-owner').val().trim();
    const startDate = $('#task-start').val();
    const endDate = $('#task-end').val();

    if (!name || !owner) {
      alert("모든 항목을 입력하세요.");
      return;
    }

    // pageId 추출
    const params = new URLSearchParams(window.location.search);
    const pageId = params.get("page");
    if (!pageId) {
      alert("pageId가 없습니다. URL을 확인하세요.");
      return;
    }

    // 카드 정보 준비
    const cardData = {
      cardName: name,
      author: owner,
      startDate: startDate,
      endDate: endDate,
      status: targetColumn.closest('.column').data('status'),
      pageId: pageId
    };

    // 1. 서버에 저장
    $.ajax({
      url: "http://localhost:3030/api/save",
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify(cardData),
      success: function (response) {
        // 2. 컬럼에 카드 DOM 바로 추가
        const $card = $('<div class="card"></div>');
        $card.attr({
          'data-id': response.cardId || response.id,
          'data-name': response.cardName || name,
          'data-owner': response.author || owner,
          'data-start': response.startDate || startDate,
          'data-end': response.endDate || endDate,
          'data-status': response.status || cardData.status
        });
        $card.html(`
          <strong>${response.cardName || name}</strong><br>
          <small>${response.author || owner}</small>
          <button class="delete-card-btn">삭제</button>
        `);
        applyStatusStyle($card, response.status || cardData.status);
        addDragAndDropEvents($card);
        // 상세보기 모달 이벤트도 카드에 바인딩
        $card.on('click', function (e) {
          if ($(e.target).hasClass('delete-card-btn')) return;
          $('#detail-title').text(`이름: ${response.cardName || name}`);
          $('#detail-owner').text(`담당자: ${response.author || owner}`);
          $('#detail-dates').text(`기간: ${(response.startDate || startDate) || ''} ~ ${(response.endDate || endDate) || ''}`);
          $('#detail-modal').show();
        });
        targetColumn.append($card);
        // 3. 간트차트도 즉시 반영
        ganttCards.push({
          id: response.cardId || response.id,
          title: response.cardName || name,
          startDate: response.startDate || startDate,
          endDate: response.endDate || endDate,
          status: response.status || cardData.status,
          author: response.author || owner
        });
        renderGanttChart();
        scrollToCardStartDate(startDate);
        $('#modal').hide();
        clearModalInputs();
      },
      error: function (error) {
        alert("카드 저장 실패: " + error.responseText);
      }
    });
  });

  $('.column').on('dragover', function (e) {
    e.preventDefault();
    $(this).addClass('drag-over');
  });

  $('.column').on('dragleave', function () {
    $(this).removeClass('drag-over');
  });

  $('.column').on('drop', function (e) {
    e.preventDefault();
    $(this).removeClass('drag-over');

    const $draggingCard = $('.dragging');
    if ($draggingCard.length) {
      $(this).find('.card-list').append($draggingCard);
      const status = $(this).data('status');
      applyStatusStyle($draggingCard, status);
      renderGanttChart();
      updateCardStatus($draggingCard);
    }
  });

  const today = new Date();
  const dateStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  $('.gantt-box').append(`<div style="padding-top: 10px;">📅 오늘: ${dateStr}</div>`);

  renderCalendar(currentDate);
  connectGanttScrollToMonthLabel();
    $('#save-calendar-entry').on('click', function () {
  const note = $('#calendar-note').val().trim();
  const selectedDate = $('#selected-date-text').text().replace('📌 선택된 날짜: ', '');

  if (!note && !selectedDate) {
    alert('날짜를 선택하고 메모를 작성하세요.');
    return;
  }

  // 해당 날짜 셀 찾기 (예: 2025년 6월 5일 → 5)
  const selectedDay = parseInt(selectedDate.split(' ')[2].replace('일', ''));
  const $targetCell = $('#calendar-days .day-cell').filter(function () {
    return $(this).text() === String(selectedDay);
  });

  if ($targetCell.length) {
    $targetCell.attr('title', note); // 툴팁 표시용
    $targetCell.append(`<div class="calendar-note">${note}</div>`);
  }

  $('#calendar-note').val('');
  $('.calendar-entry-panel').hide();
  });
  
});

function addDragAndDropEvents($card) {
  $card.attr('draggable', true);

  $card.on('dragstart', function (e) {
    e.originalEvent.dataTransfer.setData('text/plain', $(this).text());
    $(this).addClass('dragging');
  });

  $card.on('dragend', function () {
    $(this).removeClass('dragging');
  });

  // 카드 클릭 시 상세정보 모달 열기 (단, 삭제 버튼 클릭이 아닐 때만)
  $card.on('click', function (e) {
    if ($(e.target).hasClass('delete-card-btn')) return; // 삭제 버튼 클릭 시 무시
    $('#detail-title').text(`이름: ${$(this).data('name')}`);
    $('#detail-owner').text(`담당자: ${$(this).data('owner')}`);
    $('#detail-dates').text(`기간: ${$(this).data('start')} ~ ${$(this).data('end')}`);
    $('#detail-modal').show();
  });
}

$(document).on('click', '.delete-card-btn', function (e) {
  e.stopPropagation();
  if (!confirm("정말로 이 카드를 삭제하시겠습니까?")) return;

  const $card = $(this).closest('.card');
  const cardId = $card.data('id');

  if (!cardId) {
    alert("카드 ID를 찾을 수 없습니다.");
    return;
  }

  $.ajax({
    url: `http://localhost:3030/api/card/${cardId}`,
    method: "DELETE",
    success: function () {
      console.log("카드 삭제 완료");
      $card.remove();
      renderGanttChart();
      $('#detail-modal').hide(); // 삭제 성공 시에만 상세정보 모달 닫기
    },
    error: function (xhr) {
      alert("카드 삭제 실패: " + xhr.responseText);
    }
  });
});

// ====== 문서 파일 업로드/다운로드/조회 ======
function loadDocumentList() {
  $.ajax({
    url: 'http://localhost:3030/documents/list',
    method: 'GET',
    success: function(files) {
      const $docList = $('.doc-list');
      // 기존 업로드 파일 목록 제거
      $docList.find('.uploaded-file').remove();
      if (files.length === 0) return;
      files.forEach(function(filename) {
        const $li = $('<li class="uploaded-file"></li>');
        $li.text('📄 ' + filename + ' ');
        const $downloadBtn = $('<button>다운로드</button>');
        $downloadBtn.on('click', function() {
          window.location.href = `http://localhost:3030/documents/download/${encodeURIComponent(filename)}`;
        });
        const $deleteBtn = $('<button>삭제</button>');
        $deleteBtn.on('click', function() {
          if (!confirm('정말 삭제하시겠습니까?')) return;
          $.ajax({
            url: `http://localhost:3030/documents/delete/${encodeURIComponent(filename)}`,
            method: 'DELETE',
            success: function() {
              alert('삭제 성공!');
              loadDocumentList();
            },
            error: function() {
              alert('삭제 실패!');
            }
          });
        });
        $li.append($downloadBtn).append($deleteBtn);
        $docList.append($li);
      });
    },
    error: function() {
      alert('문서 목록을 불러오지 못했습니다.');
    }
  });
}

// 업로드 버튼 이벤트
$('#file-upload-btn').on('click', function() {
  const fileInput = document.getElementById('file-upload-input');
  if (!fileInput.files.length) {
    alert('업로드할 파일을 선택하세요.');
    return;
  }
  const formData = new FormData();
  formData.append('file', fileInput.files[0]);
  $.ajax({
    url: 'http://localhost:3030/documents/upload',
    method: 'POST',
    data: formData,
    processData: false,
    contentType: false,
    success: function() {
      alert('업로드 성공!');
      fileInput.value = '';
      loadDocumentList();
    },
    error: function() {
      alert('업로드 실패!');
    }
  });
});

// 페이지 로드 시 문서 목록 불러오기
loadDocumentList();

// ===================== Notion 스타일 Gantt Chart 핵심 리팩터링 =====================
// 1. 1년치 헤더와 바디는 카드가 없어도 항상 렌더링
// 2. 좌/우 스크롤 시 1년 단위로 확장
// 3. 카드 생성 시 입력한 날짜에 맞춰 간트바 자동 배치

// 기존 전역 변수 재사용 (ganttStartDate, ganttEndDate, ganttCards)
let ganttExpanding = false;

function renderGanttChart() {
  const $gantt = $('#gantt-chart');
  $gantt.empty();

  // 날짜 배열 생성
  const dayCellWidth = 44;
  let days = [];
  let d = new Date(ganttStartDate);
  while (d <= ganttEndDate) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }

  // 헤더 생성 (3줄: 년/월/일)
  const $header = $('<div class="gantt-header"></div>');
  // grid-template-columns를 days.length에 맞춰 통일
  const gridStyle = `display: grid; grid-template-columns: repeat(${days.length}, ${dayCellWidth}px);`;

  // 연도 헤더
  const $yearHeader = $('<div class="gantt-header-years"></div>').attr('style', gridStyle);
  let prevYear = null, yearStart = 0;
  days.forEach((date, i) => {
    const y = date.getFullYear();
    if (y !== prevYear) {
      if (prevYear !== null) {
        $yearHeader.append(`<div class='gantt-cell-year' style='grid-column: ${yearStart + 1} / ${i + 1};'>${prevYear}년</div>`);
      }
      prevYear = y;
      yearStart = i;
    }
  });
  // 마지막 연도 셀
  if (prevYear !== null) {
    $yearHeader.append(`<div class='gantt-cell-year' style='grid-column: ${yearStart + 1} / ${days.length + 1};'>${prevYear}년</div>`);
  }

  // 월 헤더 (월 전체 구간 병합, 한 번만 표시)
  const $monthHeader = $('<div class="gantt-header-months"></div>').attr('style', gridStyle);
  let prevMonth = null, monthStart = 0;
  days.forEach((date, i) => {
    const m = date.getMonth() + 1;
    if (m !== prevMonth) {
      if (prevMonth !== null) {
        $monthHeader.append(`<div class='gantt-cell-month' style='grid-column: ${monthStart + 1} / ${i + 1};'>${prevMonth}월</div>`);
      }
      prevMonth = m;
      monthStart = i;
    }
  });
  // 마지막 월 셀
  if (prevMonth !== null) {
    $monthHeader.append(`<div class='gantt-cell-month' style='grid-column: ${monthStart + 1} / ${days.length + 1};'>${prevMonth}월</div>`);
  }

  // 일 헤더
  const $dayHeader = $('<div class="gantt-header-days"></div>').attr('style', gridStyle);
  days.forEach((date, i) => {
    $dayHeader.append(`<div class='gantt-cell-day'>${date.getDate()}</div>`);
  });

  $header.append($yearHeader).append($monthHeader).append($dayHeader);
  $gantt.append($header);

  // 카드(간트바) 렌더링: 각 카드마다 한 줄씩 grid-row 지정
  ganttCards.forEach((card, idx) => {
    let s = card.startDate ? new Date(card.startDate) : new Date(ganttStartDate);
    let e = card.endDate ? new Date(card.endDate) : new Date(ganttEndDate);
    const startIdx = Math.max(0, Math.floor((s - ganttStartDate) / (1000 * 60 * 60 * 24)));
    const endIdx = Math.min(days.length - 1, Math.floor((e - ganttStartDate) / (1000 * 60 * 60 * 24)));
    if (isNaN(startIdx) || isNaN(endIdx) || startIdx > endIdx) return;
    const statusClass = card.status === 'Scheduled'
    ? 'scheduled'
    : card.status === 'In Progress'
      ? 'in-progress'
      : card.status === 'Done'
        ? 'done'
        : '';

    const $bar = $(`<div class="gantt-bar ${statusClass}" style="grid-column:${startIdx + 1} / ${endIdx + 2}; grid-row:${idx + 4};">${card.title}</div>`);

    $gantt.append($bar);
  });

  // Gantt 전체를 grid로, 헤더와 바디 align 통일
  $gantt.css({
    'display': 'grid',
    'grid-template-columns': `repeat(${days.length}, ${dayCellWidth}px)`,
    'grid-auto-rows': '40px',
    'align-items': 'center',
    'position': 'relative',
    'background': '#181818',
    'min-height': '200px',
    'overflow-x': 'auto'
  });

}

// 무한 스크롤: 좌/우 1년 단위 확장
$('#gantt-chart').off('scroll').on('scroll', function () {
  if (ganttExpanding) return;
  const $box = $(this);
  // 좌측 끝 근처
  if ($box.scrollLeft() < 100) {
    ganttExpanding = true;
    ganttStartDate.setFullYear(ganttStartDate.getFullYear() - 1);
    renderGanttChart();
    $box.scrollLeft($box.scrollLeft() + 365 * 44); // 1년치 만큼 오른쪽으로 이동
    ganttExpanding = false;
  }
  // 우측 끝 근처
  if ($box[0].scrollWidth - $box.scrollLeft() - $box.outerWidth() < 100) {
    ganttExpanding = true;
    ganttEndDate.setFullYear(ganttEndDate.getFullYear() + 1);
    renderGanttChart();
    ganttExpanding = false;
  }
});

// 카드 추가 시 입력 날짜에 맞춰 간트바 자동 배치
function addGanttCard(card) {
  // 서버 동기화 후 카드 목록 재로드
  const params = new URLSearchParams(window.location.search);
  const pageId = params.get("page");
  if (!pageId) {
    alert("pageId가 없습니다. URL을 확인하세요.");
    return;
  }
  card.pageId = pageId;
  $.ajax({
    url: "http://localhost:3030/api/save",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify(card),
    success: function() {
      loadGanttCardsFromServer();
    },
    error: function(xhr) {
      alert("카드 저장 실패: " + xhr.responseText);
    }
  });
}

// 서버에서 카드 목록 불러오기
function loadGanttCardsFromServer() {
  $.ajax({
    url: "http://localhost:3030/api/cards",
    method: "GET",
    success: function(cards) {
      ganttCards = cards.map(card => ({
        id: card.cardId,
        title: card.cardName,
        startDate: card.startDate ? card.startDate.slice(0, 10) : "",
        endDate: card.endDate ? card.endDate.slice(0, 10) : "",
        status: card.status,
        author: card.author
      }));
      renderGanttChart(true);
    },
    error: function() {
      alert("간트차트 카드 데이터를 불러오지 못했습니다.");
    }
  });
}

// 페이지 로드 시 초기 렌더링
$(window).on('load', function() {
  loadGanttCardsFromServer();
});

// ====== 유틸 함수: ReferenceError 방지용 ======
function renderCalendar(date) {
  if (!date) date = new Date();
  $('#month-year').text(`${date.getFullYear()}년 ${date.getMonth() + 1}월`);
  const $days = $('#calendar-days');
  $days.empty();
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDayOfWeek = firstDay.getDay();
  const totalDays = lastDay.getDate();
  // 빈 칸 채우기 (1일 전까지)
  for (let i = 0; i < startDayOfWeek; i++) {
    $days.append('<div class="day-cell empty"></div>');
  }
  // 날짜 채우기
  for (let d = 1; d <= totalDays; d++) {
    const cellDate = new Date(year, month, d);
    const isToday = cellDate.toDateString() === new Date().toDateString();
    $days.append(`<div class="day-cell${isToday ? ' today' : ''}" data-date="${year}-${month + 1}-${d}">${d}</div>`);
  }
  // 날짜 클릭 시 일정 입력 패널 표시
  $('.day-cell').off('click').on('click', function() {
    if ($(this).hasClass('empty')) return;
    const dateStr = $(this).data('date');
    $('#selected-date-text').text('📌 선택된 날짜: ' + dateStr);
    $('.calendar-entry-panel').show();
  });
}

function changeMonth(offset) {
  if (!window.currentDate) window.currentDate = new Date();
  window.currentDate.setMonth(window.currentDate.getMonth() + offset);
  renderCalendar(window.currentDate);
}

function applyStatusStyle($card, status) {
  $card.removeClass('scheduled in-progress done');
  if (!status) return;
  if (status === 'Scheduled') $card.addClass('scheduled');
  else if (status === 'In Progress') $card.addClass('in-progress');
  else if (status === 'Done') $card.addClass('done');
}

function clearModalInputs() {
  $('#task-name').val('');
  $('#task-owner').val('');
  $('#task-start').val('');
  $('#task-end').val('');
}

function switchTab(tabName) {
  $('.tab').removeClass('active');
  $('.tab-content').removeClass('active');
  if (tabName === 'calendar') {
    $('.tab').eq(0).addClass('active');
    $('#calendar-view').addClass('active');
  } else if (tabName === 'gantt') {
    $('.tab').eq(1).addClass('active');
    $('#gantt-view').addClass('active');
  }
}

// Gantt 차트 스크롤 시 월 헤더와 동기화 (더미 함수, 실제 구현 필요시 보완)
function connectGanttScrollToMonthLabel() {
  // 예시: 실제로는 스크롤 위치에 따라 월 헤더 강조 등 구현 가능
  // 현재는 오류 방지용 빈 함수
}


function scrollToCardStartDate(startDateStr) {
  const startDate = new Date(startDateStr);
  startDate.setHours(0, 0, 0, 0);

  const dayCellWidth = 44;
  const days = [];
  let d = new Date(ganttStartDate);
  while (d <= ganttEndDate) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }

  const index = days.findIndex(d =>
    d.getFullYear() === startDate.getFullYear() &&
    d.getMonth() === startDate.getMonth() &&
    d.getDate() === startDate.getDate()
  );

  if (index !== -1) {
    const scrollTarget = index * dayCellWidth;
    setTimeout(() => {
      $('#gantt-chart')[0].scrollLeft = scrollTarget - ($('#gantt-chart').width() / 2) + (dayCellWidth / 2);
    }, 0);
  }
}