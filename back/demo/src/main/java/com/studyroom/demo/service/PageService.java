package com.studyroom.demo.service;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.studyroom.demo.entity.*;
import com.studyroom.demo.etc.SessionValue;
import com.studyroom.demo.repository.*;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PageService {

    private final PageRepository pageRepository;
    private final UserRepository userRepository;
    private final CollaboratorRepository collaboratorRepository;

    public boolean checkUserAccessToPage(Integer userId, Integer pageId) {
        Optional<User> hasUser = userRepository.findById(userId);
        Optional<Page> isPageExist = pageRepository.findById(pageId);

        if (hasUser.isEmpty() || isPageExist.isEmpty()) {
            return false;
        }

        User user = hasUser.get();
        Page page = isPageExist.get();

        // 개인 페이지 접근 확인
        if (user.getPage() != null && user.getPage().getPageId().equals(pageId)) {
            return true;
        }

        // 협업자 접근 확인
        return collaboratorRepository.existsByUserAndPage(user, page);
    }

    public boolean acceptInviteCode(SessionValue sessionValue, Integer pageId, String invite){
        // String CurrentUserEmail = user.getUserEmail();
        // String decodedEmail = new String(Base64.getDecoder().decode(invite), StandardCharsets.UTF_8);

        // if (decodedEmail.equals(CurrentUserEmail)) return true;
        // return false;
        Integer userId = ((User)sessionValue.userInfo()).getId();
        Optional<User> userOpt = userRepository.findById(userId);
        User currentUser = userOpt.get();
        
        byte[] validEmailBytes = Base64.getDecoder().decode(invite);
        String validEmail = new String(validEmailBytes, StandardCharsets.UTF_8);

        if (!currentUser.getUserEmail().equals(validEmail)) return false;

        Optional<Page> isPageExist = pageRepository.findById(pageId);
        if (!isPageExist.isPresent()) return false;
        Page page = isPageExist.get();
        Collaborator collab = Collaborator.builder()
            .user(currentUser)
            .page(page)
            .build();
        collaboratorRepository.save(collab);
        return true;
    }
}
