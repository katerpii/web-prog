// $(document).ready(function () {
//   const $modal = $('#modal');
  // const params = new URLSearchParams(window.location.search);
  // const isAuthorized = params.has("page");
  // const isInvite = params.has("invite");
  // let requestUrl;
  // if (isAuthorized) {
  //   let page = params.get("page")    
  //   if (isInvite) {
  //     const invite = params.get("invite");
  //     requestUrl = `http://localhost:3030/auth/check?page=${pageId}&invite=${invite}`
  //   } else {
  //     requestUrl = `http://localhost:3030/auth/check?page=${pageId}`
  //   }
  // } else {
  //   requestUrl = `http://localhost:3030/auth/check`
  // }

  // // 로그인 여부 확인
  // $.ajax({
  //   url: requestUrl,
  //   method: 'GET',
  //   xhrFields: { withCredentials: true },
  //   success: function (form) {
  //     $('.login-btn').hide();
  //     $('.logout-btn').show();
  //     $('#user-name').text(`${form.username || form.userEmail || '사용자'} 's Project`);
  //     $('body').addClass('logged-in');
  //     loadUserPage(form.id, pageId);
  //   },
  //   error: function () {
  //     $('.login-btn').show();
  //     $('.logout-btn').hide();
  //   }
  // });
$(document).ready(function () {
  const $modal = $('#modal');
  const $dropdown = $('#project-dropdown');
  const $projectTitle = $('.project-title');
  const $projectList = $('#project-list');
  const $userName = $('#user-name');
  const params = new URLSearchParams(window.location.search);
  const pageId = params.get("page");
  const invite = params.get("invite");

  const url = new URL("http://localhost:3030/auth/check");

  if (pageId) url.searchParams.append("page", pageId);
  if (invite) url.searchParams.append("invite", invite);
  // 드롭다운 열고 닫기
  $('#project-dropdown').on('click', function (e) {
    e.stopPropagation(); // 이벤트 전파 방지
    $('.project-header').toggleClass('open');
    $('#project-list').toggleClass('hidden');
  });

  // 드롭다운 외부 클릭 시 닫기
  $(document).on('click', function () {
    $('.project-header').removeClass('open');
    $('#project-list').addClass('hidden');
  });

  $.ajax({
    url: url.toString(),
    method: "GET",
    xhrFields: { withCredentials: true },
    success: function (res) {
      const { authenticated, hasAccess, isInvite, user, userProject, invitedList} = res;

      if (!authenticated) {
        console.log("unauthorized");
        if (isInvite) {
          console.log("login required");
          window.location.href = `http://localhost:3000/login?${params}`;
        }
      } else if(isInvite){ // invite with session
          console.log("invited");
          window.location.href = `http://localhost:3000/index?page=${pageId}`;
      } else if (hasAccess) {
        console.log("hasAcess");
        $('.login-btn').hide();
        $('.logout-btn').show();
        $userName.text(`Hello, ${user.username || user.userEmail || '사용자'}`);
        $('body').addClass('logged-in');
        loadUserPage(user.id, pageId);
        if (userProject){
          $projectTitle.html(`
            ${userProject.pagename}
            <svg id="dropdown-icon" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 7l5 5 5-5z"/>
            </svg>
          `);

          $projectList.empty();
            
          $projectList.append(`<div class="project-item selected" data-id="${userProject.pageId}">${userProject.pagename}</div>`);
          invitedList.forEach(p => {
            $projectList.append(`<div class="project-item" data-id="${p.pageId}">${p.pagename}</div>`);
          });
          
          const $activeProject = $projectList.find(`.project-item[data-id="${pageId}"]`);
          if ($activeProject.length > 0) {
            $projectTitle.html(`
              ${$activeProject.text()}
              <svg id="dropdown-icon" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 7l5 5 5-5z"/>
              </svg>
            `);
          } else {
            $projectTitle.text("Projects"); // fallback
          }
        } else console.log("userProject: none");
        $('.project-item').on('click', function () {
          const pid = $(this).data('id');
          window.location.href = `http://localhost:3000/index?page=${pid}`;
        });
      } else {
        // $('body').addClass('logged-in');
        window.location.href = `http://localhost:3000/index?page=${user.id}`;
      }
    },
    error: function (err) {
      console.log(err);
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
        window.location.href = "http://localhost:3000/index";
      }
    });
  });

  // 유저 페이지 불러오기
  function loadUserPage(userId, pageId) {
    $.ajax({
      url: `http://localhost:3030/user/${userId}/page/${[pageId]}`,
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
        updateCardStatus($draggingCard);
      }
    });
  }

  function renderCard(card, boardStatus) {
    // 카드의 status가 없으면 boardStatus 또는 'Scheduled'로 fallback
    const status = card.status || boardStatus || 'Scheduled';
    const $card = $('<div class="card" draggable="true"></div>');
    $card.attr({
      'data-id': card.id !== undefined ? String(card.id) : '',
      'data-name': card.name !== undefined ? String(card.name) : '',
      'data-owner': card.author !== undefined ? String(card.author) : '',
      'data-start': card.startDate !== undefined ? String(card.startDate) : '',
      'data-end': card.endDate !== undefined ? String(card.endDate) : '',
      'data-status': status
    });
    $card.html(`
      <strong>${card.name || ''}</strong><br>
      <small>${card.author || ''}</small>
      <button class="delete-card-btn">삭제</button>
    `);
    applyStatusStyle($card, status);
    addDragAndDropEvents($card);
    return $card;
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
            const $card = renderCard(card, board.status);
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
  const params = new URLSearchParams(window.location.search);
  const pageId = params.get('page');
  if (!cardId || !newStatus) return;
  $.ajax({
    url: `http://localhost:3030/api/card/${cardId}/move`,
    method: "PATCH",
    contentType: "application/json",
    data: JSON.stringify({ status: newStatus, pageId: pageId }),
    success: function () {
      console.log("카드 상태 업데이트 완료");
    },
    error: function (xhr) {
      alert("카드 상태 업데이트 실패: " + xhr.responseText);
    }
  });
}
