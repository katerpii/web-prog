let targetColumn = null;

$(document).ready(function() {
  const $popup = $('#login-popup')

  $('.login-btn').on('click', function () {
    $popup.show();
  })

  $('.close-popup').on('click', function () {
    $popup.hide();
  })

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
          `&state=${encodeURIComponent(auth.state)}`+
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
        const auth = response.authorization;
        const loginUrl =
          `${auth.authorizationEndpoint}?` +
          `client_id=${encodeURIComponent(auth.clientId)}` +
          `&redirect_uri=${encodeURIComponent(auth.redirectUrl)}` + 
          `&response_type=${encodeURIComponent(auth.responseType)}` +
          `&scope=${encodeURIComponent(auth.scope)}` +
          `&state=${encodeURIComponent(auth.state)}`+
          `&prompt=consent`;

        window.location.href = loginUrl;
        
      },
      error: function (error) {
        console.error('로그인 요청 실패:', error);
      }
    });
  });
})

$(document).ready(function () {
  // 각 column에는 반드시 data-status 속성이 있어야 합니다 (예: data-status="Done")
  const $modal = $('#modal');
  const $detailModal = $('#detail-modal');

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
        // 생성된 카드 DOM에 data-  id 추가 (여기선 임의로 가정, 실제 구현 시 응답값에서 id 추출 필요)
        $newCard.attr({
          'data-name': name,
          'data-owner': owner,
          'data-start': startDate,
          'data-end': endDate,
          'data-id': realCardId // 실제로는 서버에서 받은 ID로 대체
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
      error: function (xhr) {
        alert("카드 저장 실패: " + xhr.responseText);
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
  
   //드래그 앤 드롭 이벤트 
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

  // 오늘 날짜 마커 추가
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  $('.gantt-box').append(`<div style="padding-top: 10px;">📅 오늘: ${dateStr}</div>`);

  renderCalendar(currentDate); // 캘린더 초기화
  connectGanttScrollToMonthLabel(); // Gantt 스크롤 연동
});

// 카드 삭제 버튼 추가 및 이벤트 처리
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
      renderGanttChart(); // Gantt 차트 갱신
    },
    error: function (xhr) {
      alert("카드 삭제 실패: " + xhr.responseText);
    }
  });
});

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

// === 캘린더 ===
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
    $calendarDays.append("<div></div>");
  }

  for (let day = 1; day <= lastDate; day++) {
    const thisDate = new Date(year, month, day);
    const $dayDiv = $("<div></div>").text(day);
    if (thisDate.toDateString() === new Date().toDateString()) {
      $dayDiv.addClass("today");
    }
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
    status: $card.closest('.column').data('status'),  // 컬럼의 상태(Scheduled, In Progress, Done)
  };

  $.ajax({
    url: 'http://localhost:3030/api/save',  // 서버에서 해당 API 엔드포인트
    method: 'POST',
    contentType: 'application/json',
    data: JSON.stringify(cardData),
    success: function (response) {
      console.log('Card data saved successfully');
    },
    error: function (error) {
      console.error('Failed to save card data', error);
    }
  });
}



// 🧩 카드 드래그앤드롭 후 상태(board) 업데이트 처리
$(document).on("dragend", ".card", function () {
  const $card = $(this);
  const cardId = $card.data("id"); // 카드 ID는 생성 시 data-id로 설정되어 있어야 함
  const newBoard = $card.closest(".column").data("status"); // column div에 data-status 필요

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

