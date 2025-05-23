package com.studyroom.demo.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.studyroom.demo.entity.Page;
import com.studyroom.demo.entity.User;

public interface PageRepository extends JpaRepository<Page, Integer> {
    Optional<Page> findByUser(User user);
}
