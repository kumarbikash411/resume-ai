package com.resumeai.repository;

import com.resumeai.entity.Resume;
import com.resumeai.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ResumeRepository extends JpaRepository<Resume, Long> {
    List<Resume> findByUserOrderByUploadedAtDesc(User user);
    Optional<Resume> findByIdAndUser(Long id, User user);
    long countByUser(User user);
}
