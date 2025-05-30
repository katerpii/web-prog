package com.studyroom.demo.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.studyroom.demo.entity.Board;

public interface BoardRepository extends JpaRepository<Board, Integer> {
    Optional<Board> findByStatusAndPage_PageId(String status, Integer pageId);
}
