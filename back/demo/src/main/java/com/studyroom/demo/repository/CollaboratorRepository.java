package com.studyroom.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.studyroom.demo.entity.Collaborator;
import com.studyroom.demo.entity.Page;
import com.studyroom.demo.entity.User;

public interface CollaboratorRepository extends JpaRepository<Collaborator, Integer> {

    // 특정 유저가 특정 페이지의 협업자인지 여부
    boolean existsByUserAndPage(User user, Page page);

    // 해당 페이지에 속한 모든 협업자 조회
    List<Collaborator> findByPage(Page page);

    // 특정 유저가 협업자로 참여 중인 페이지들 조회
    List<Collaborator> findByUser(User user);

    // 중복 등록 방지용
    Optional<Collaborator> findByUserAndPage(User user, Page page);
}
