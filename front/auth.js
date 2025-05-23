

$(document).ready(function (){
    const $modal = $('#modal'); 
    $.ajax({
        url: 'http://localhost:3030/auth/check',
        method: 'GET',
        xhrFields: {
            withCredentials: true
        },
        success: function (user) {
            $('.login-btn').hide();
            $('.logout-btn').show();
            $('#user-name').text(`${user.username || user.userEmail || '사용자'} 's Project`);
        
            $('body').addClass('logged-in');
            loadUserPage(user.id);
        },
        error: function() {
            $('.login-btn').show();
            $('.logout-btn').hide();
        }
    })
    $('.logout-btn').on('click', function () {
      $.ajax({
        url: 'http://localhost:3030/auth/logout',
        method: 'POST',
        xhrFields: {
          withCredentials: true
        },
        success: function () {
          location.reload(); // 새로고침으로 초기화
        }
      });
    });

    function loadUserPage(Id){
      $.ajax({
        url: `http://localhost:3030/user/${Id}/page`,
        method: 'GET',
        xhrFields: {
            withCredentials: true 
        },
        success: function (pageData){
          displayPageData(pageData);
        },
        error: function() {
          console.log("fetch data failed");
        }
      });
    }

function displayPageData(pageData) {
    $('#page-name').text(pageData.pagename);  // 페이지 이름
    $('#github-url').attr('href', pageData.githubUrl);  // GitHub 링크

    $('.board-columns').empty();

    // boards가 null 또는 undefined일 경우 빈 배열로 처리
    if (pageData.boards && pageData.boards.length > 0) {
        pageData.boards.forEach(board => {
            let boardHtml = `<div class="column" data-status="${board.status}">
                                <h3>${board.status} <button class="add-btn">+</button></h3>
                                <div class="card-list" data-board-id="${board.id}"></div>d
                              </div>`;

            // cards가 null 또는 undefined일 경우 빈 배열로 처리
            if (board.cards && board.cards.length > 0) {
                board.cards.forEach(card => {
                    let cardHtml = `<div class="card">
                                    <span>${card.name}</span>
                                    <span>${card.startDate} ~ ${card.endDate}</span>
                                    <span>${card.author}</span>
                                </div>`;
                    $(`.board-columns .column[data-status="${board.status}"] .card-list`).append(cardHtml);
                });
            }

            $('.board-columns').append(boardHtml);
            $('.board-columns .column[data-status="'+ board.status +'"] .add-btn').on('click', function () {
                targetColumn = $(this).closest('.column').find('.card-list');
                $modal.show();
            });
        });
    } else {
        console.error("No boards available in the pageData.");
    }
}


})


