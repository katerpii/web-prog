$(document).ready(function () {
  const $modal = $('#modal');

  // 로그인 여부 확인
  $.ajax({
    url: 'http://localhost:3030/auth/check',
    method: 'GET',
    xhrFields: { withCredentials: true },
    success: function (user) {
      $('.login-btn').hide();
      $('.logout-btn').show();
      $('#user-name').text(`${user.username || user.userEmail || '사용자'} 's Project`);
      $('body').addClass('logged-in');
      loadUserPage(user.id);
    },
    error: function () {
      $('.login-btn').show();
      $('.logout-btn').hide();
    }
  });

  // 로그아웃
  $('.logout-btn').on('click', function () {
    $.ajax({
      url: 'http://localhost:3030/auth/logout',
      method: 'POST',
      xhrFields: { withCredentials: true },
      success: function () {
        location.reload();
      }
    });
  });

  // 유저 페이지 불러오기
  function loadUserPage(userId) {
    $.ajax({
      url: `http://localhost:3030/user/${userId}/page`,
      method: 'GET',
      xhrFields: { withCredentials: true },
      success: function (pageData) {
        displayPageData(pageData);
      },
      error: function () {
        console.log("fetch data failed");
      }
    });
  }

  // 카드 드래그 이벤트 바인딩
  function addDragAndDropEvents($card) {
    $card.attr('draggable', true);

    $card.on('dragstart', function (e) {
      e.originalEvent.dataTransfer.setData('text/plain', $(this).text());
      $(this).addClass('dragging');
    });

    $card.on('dragend', function () {
      $(this).removeClass('dragging');
      updateCardStatus($(this)); // 상태 업데이트 추가
    });
  }

  // 컬럼 드래그 이벤트 바인딩
  function bindColumnDropEvents() {
    $('.board-columns .column').off('dragover dragleave drop'); // 중복 방지

    $('.board-columns .column').on('dragover', function (e) {
      e.preventDefault();
      $(this).addClass('drag-over');
    });

    $('.board-columns .column').on('dragleave', function () {
      $(this).removeClass('drag-over');
    });

    $('.board-columns .column').on('drop', function (e) {
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
  }

  // 카드 및 컬럼 렌더링
  function displayPageData(pageData) {
    $('#page-name').text(pageData.pagename);
    $('#github-url').attr('href', pageData.githubUrl);
    $('.board-columns').empty();

    if (pageData.boards && pageData.boards.length > 0) {
      pageData.boards.forEach(board => {
        let boardHtml = `
          <div class="column" data-status="${board.status}">
            <h3>${board.status} <button class="add-btn">+</button></h3>
            <div class="card-list" data-board-id="${board.id}"></div>
          </div>`;
        $('.board-columns').append(boardHtml);
      });

      // 카드 추가
      pageData.boards.forEach(board => {
        if (board.cards && board.cards.length > 0) {
          board.cards.forEach(card => {
            let $card = $(`<div class="card" draggable="true" data-id="${card.id}">
                            <span>${card.name}</span>
                            <span>${card.startDate} ~ ${card.endDate}</span>
                            <span>${card.author}</span>
                          </div>`);
            addDragAndDropEvents($card);
            $(`.column[data-status="${board.status}"] .card-list`).append($card);
          });
        }

        // 카드 생성 버튼 이벤트
        $(`.column[data-status="${board.status}"] .add-btn`).on('click', function () {
          targetColumn = $(this).closest('.column').find('.card-list');
          $modal.show();
        });
      });

      // 드래그앤드롭 바인딩
      bindColumnDropEvents();
    } else {
      console.error("No boards available in the pageData.");
    }
  }
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
