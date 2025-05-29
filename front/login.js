let targetColumn = null;

$(document).ready(function () {
  // url = new URL(window.location.href);
  const params = new URLSearchParams(window.location.search);
  redirectUri = new URL("http://localhost:3000/index")

  const pageId = params.get("page")
  const invite = params.get("invite")

  $('.google-login').on('click', function () {
    $.ajax({
      url: 'http://localhost:3030/login/oauth2/google',
      method: 'GET',
      xhrFields: {
        withCredentials: true
      },
      success: function (response) {
        if (pageId) redirectUri.searchParams.append("page", pageId);
        if (invite) redirectUri.searchParams.append("invite", invite);

        const state = JSON.stringify({ 
          is_invite: params.has("invite"),
          invite_code: params.get("invite"),
          redirect_uri: redirectUri.toString()
         });
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

  $('.github-login').on('click', function () {
    $.ajax({
      url: 'http://localhost:3030/login/oauth2/github',
      method: 'GET',
      xhrFields: {
        withCredentials: true
      },
      success: function (response) {

        if (pageId) redirectUri.searchParams.append("page", pageId);
        if (invite) redirectUri.searchParams.append("invite", invite);

        const state = JSON.stringify({ 
          is_invite: params.has("invite"),  
          invite_code: params.get("invite"),
          redirect_uri: redirectUri.toString()
         });

        
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


}
)
