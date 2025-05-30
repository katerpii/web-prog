let targetColumn = null;

$(document).ready(function () {
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

  $('#add-card-confirm').on('click', function () {
    const name = $('#task-name').val().trim();
    const owner = $('#task-owner').val().trim();
    const startDate = $('#task-start').val();
    const endDate = $('#task-end').val();

    if (!name || !owner) {
      alert("모든 항목을 입력하세요.");
      return;
    }

    const $newCard = $('<div class="card"></div>');

    $.ajax({
      url: "http://localhost:3030/api/save",
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify({
        cardName: name,
        author: owner,
        startDate: startDate,
        endDate: endDate,
        status: targetColumn.closest('.column').data('status') // 현재 칼럼의 상태
      }),
      success: function (response) {
        console.log("카드 저장 완료");
        const realCardId = response.cardId;
        $newCard.attr({
          'data-name': name,
          'data-owner': owner,
          'data-start': startDate,
          'data-end': endDate,
          'data-id': realCardId
        });

        $newCard.html(`
          <strong>${name}</strong><br>
          <small>${owner}</small>
          <button class="delete-card-btn">삭제</button>
        `);

        targetColumn.append($newCard);
        $('#modal').hide();
        clearModalInputs();
      },
      error: function (error) {
        alert("카드 저장 실패: " + error.responseText);
      }
    });

    $newCard.on('click', function () {
      $('#detail-title').text(`이름: ${$(this).data('name')}`);
      $('#detail-owner').text(`담당자: ${$(this).data('owner')}`);
      $('#detail-dates').text(`기간: ${$(this).data('start')} ~ ${$(this).data('end')}`);
      $detailModal.show();
    });

    const columnStatus = targetColumn.closest('.column').data('status');
    applyStatusStyle($newCard, columnStatus);

    addDragAndDropEvents($newCard);
    targetColumn.append($newCard);

    renderGanttChart();
    saveCardDataToDB($newCard);

    $modal.hide();
    clearModalInputs();
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

$(document).on('click', '.delete-card-btn', function () {
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

function applyStatusStyle($card, status) {
  $card.removeClass('scheduled in-progress done');
  if (status === 'Scheduled') $card.addClass('scheduled');
  if (status === 'In Progress') $card.addClass('in-progress');
  if (status === 'Done') $card.addClass('done');
}

function clearModalInputs() {
  $('#task-name').val('');
  $('#task-owner').val('');
}

function addDragAndDropEvents($card) {
  $card.attr('draggable', true);

  $card.on('dragstart', function (e) {
    e.originalEvent.dataTransfer.setData('text/plain', $(this).text());
    $(this).addClass('dragging');
  });

  $card.on('dragend', function () {
    $(this).removeClass('dragging');
  });
}

function renderGanttChart() {
  const $gantt = $('#gantt-chart');
  $gantt.empty();

  const $cards = $('.card');
  if ($cards.length === 0) return;

  let earliestStart = new Date();
  $cards.each(function () {
    const start = $(this).data('start');
    if (start) {
      const d = new Date(start);
      if (d < earliestStart) earliestStart = d;
    }
  });

  const centerDate = new Date(earliestStart);
  const daysBefore = 5;
  const daysAfter = 60;
  const totalDays = daysBefore + daysAfter;

  const startDate = new Date(centerDate);
  startDate.setDate(centerDate.getDate() - daysBefore);

  const $header = $('<div class="gantt-header"></div>');
  for (let i = 0; i < totalDays; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    const $cell = $('<div class="gantt-cell"></div>');
    $cell.attr('data-date', date.toISOString());
    $cell.text(`${date.getMonth() + 1}/${date.getDate()}`);
    $header.append($cell);
  }
  $gantt.append($header);

  $cards.each(function () {
    const $card = $(this);
    const name = $card.data('name');
    const start = $card.data('start');
    const end = $card.data('end');
    if (!start || !end) return;

    const startObj = new Date(start);
    const endObj = new Date(end);
    const offset = Math.floor((startObj - startDate) / (1000 * 60 * 60 * 24));
    const duration = Math.max(1, (endObj - startObj) / (1000 * 60 * 60 * 24) + 1);

    const $row = $('<div class="gantt-row"></div>');
    const $bar = $('<div class="gantt-bar"></div>').text(name);
    $bar.css({
      left: `${offset * 30}px`,
      width: `${duration * 30}px`
    });

    if ($card.hasClass('scheduled')) $bar.addClass('scheduled');
    else if ($card.hasClass('in-progress')) $bar.addClass('in-progress');
    else if ($card.hasClass('done')) $bar.addClass('done');

    $row.append($bar);
    $gantt.append($row);
  });

  $gantt.scrollLeft(((new Date() - startDate) / (1000 * 60 * 60 * 24)) * 30);
}

function connectGanttScrollToMonthLabel() {
  const $gantt = $('#gantt-chart');
  const $label = $('.gantt-month-label');
  const dayWidth = 30;

  $gantt.on('scroll', function () {
    const scrollLeft = $gantt.scrollLeft();
    const offsetDays = Math.floor(scrollLeft / dayWidth);
    const $firstCell = $gantt.find('.gantt-cell').first();
    if (!$firstCell.length) return;

    const firstDate = new Date($firstCell.data('date'));
    const currentDate = new Date(firstDate);
    currentDate.setDate(firstDate.getDate() + offsetDays);
    $label.text(`${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월`);

    const maxScroll = $gantt[0].scrollWidth - $gantt.width();

    if (scrollLeft > maxScroll - 200) {
      expandGanttDays(30, 'right');
    }
    if (scrollLeft < 200) {
      expandGanttDays(30, 'left');
    }
  });

  const $firstCell = $gantt.find('.gantt-cell').first();
  if ($firstCell.length) {
    const startDate = new Date($firstCell.data('date'));
    $label.text(`${startDate.getFullYear()}년 ${startDate.getMonth() + 1}월`);
  }
}

let currentDate = new Date();

function renderCalendar(date) {
  const $calendarDays = $("#calendar-days");
  const $monthYear = $("#month-year");
  $calendarDays.empty();

  const year = date.getFullYear();
  const month = date.getMonth();
  $monthYear.text(`${year}년 ${month + 1}월`);

  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    $calendarDays.append("<div class='day-cell empty'></div>");
  }

  for (let day = 1; day <= lastDate; day++) {
    const thisDate = new Date(year, month, day);
    const $dayDiv = $("<div class='day-cell'></div>").text(day);

    if (thisDate.toDateString() === new Date().toDateString()) {
      $dayDiv.addClass("today");
    }

    // ✅ 날짜 클릭 시 우측 패널에 표시
    $dayDiv.on("click", function () {
      const dateStr = `${year}년 ${month + 1}월 ${day}일`;
      $("#selected-date-text").text(`📌 선택된 날짜: ${dateStr}`);
      $("#calendar-note").val(""); // 초기화
      $(".calendar-entry-panel").show();
    });

    $calendarDays.append($dayDiv);
  }
}

function changeMonth(diff) {
  currentDate.setMonth(currentDate.getMonth() + diff);
  renderCalendar(currentDate);
}

function switchTab(tabName) {
  $(".tab-content").removeClass("active");
  $(".tab").removeClass("active");
  $(`#${tabName}-view`).addClass("active");
  $(`.tab[onclick*="${tabName}"]`).addClass("active");
}

function saveCardDataToDB($card) {
  const cardData = {
    cardName: $card.data('name'),
    author: $card.data('owner'),
    startDate: $card.data('start'),
    endDate: $card.data('end'),
    status: $card.closest('.column').data('status'),
  };

  $.ajax({
    url: 'http://localhost:3030/api/save',
    method: 'POST',
    contentType: 'application/json',
    xhrFields: {
      withCredentials: true
    },
    data: JSON.stringify(cardData),
    success: function (response) {
      console.log('Card data saved successfully');
    },
    error: function (error) {
      console.error('Failed to save card data', error);
    }
  });
}

$(document).on("dragend", ".card", function () {
  const $card = $(this);
  const cardId = $card.data("id");
  const newBoard = $card.closest(".column").data("status");

  if (!cardId || !newBoard) {
    console.warn("카드 ID 또는 새로운 보드 상태가 없습니다.");
    return;
  }

  $.ajax({
    url: `http://localhost:3030/api/card/${cardId}/move`,
    method: "PATCH",
    contentType: "application/json",
    data: JSON.stringify({ status: newBoard }),
    success: function () {
      console.log("카드 상태가 성공적으로 변경되었습니다.");
    },
    error: function (xhr) {
      alert("카드 이동 실패: " + xhr.responseText);
    }
  });
});

function updateCardStatus($card) {
  const cardId = $card.data("id");
  const newStatus = $card.closest(".column").data("status");

  if (!cardId || !newStatus) return;

  $.ajax({
    url: `http://localhost:3030/api/card/${cardId}/move`,
    method: "PATCH",
    contentType: "application/json",
    data: JSON.stringify({ status: newStatus }),
    success: function () {
      console.log("카드 상태 업데이트 완료");
    },
    error: function (xhr) {
      alert("카드 상태 업데이트 실패: " + xhr.responseText);
    }
  });
}

document.getElementById('markdown-input').addEventListener('input', function () {
  const markdownText = this.value;
  const html = marked.parse(markdownText);
  document.getElementById('markdown-preview').innerHTML = html;
});

// 날짜 클릭 시 일정 입력 패널 표시
$("#calendar-days").on("click", ".day-cell", function () {
  const day = $(this).text();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  selectedCalendarDate = `${year}-${month}-${day}`;

  $("#selected-date-text").text(`📌 선택된 날짜: ${selectedCalendarDate}`);
  $(".calendar-entry-panel").show();
});

// 저장 버튼 이벤트
$('#save-calendar-entry').on('click', function () {
  const note = $('#calendar-note').val().trim();

  if (!selectedCalendarDate || !note) {
    alert("날짜를 선택하고 메모를 작성하세요.");
    return;
  }

  const $targetDay = $("#calendar-days .day-cell").filter(function () {
    return $(this).text() === String(parseInt(selectedCalendarDate.split("-")[2]));
  });

  $targetDay.attr("title", note); // 툴팁용
  $targetDay.addClass("has-note"); // 스타일 줄 때

  // 초기화
  $('#calendar-note').val('');
  selectedCalendarDate = null;
  $('#selected-date-text').text('날짜를 클릭하세요');

});


