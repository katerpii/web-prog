package com.studyroom.demo.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import com.studyroom.demo.entity.User;

public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByUserEmail(String userEmail);
}

