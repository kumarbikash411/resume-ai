package com.resumeai.service;

import com.resumeai.dto.ResumeDto;
import com.resumeai.entity.Resume;
import com.resumeai.entity.User;
import com.resumeai.repository.ResumeRepository;
import com.resumeai.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.apache.pdfbox.Loader;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;


@Service
@Slf4j
@RequiredArgsConstructor
public class ResumeService {

    private final ResumeRepository resumeRepository;
    private final UserRepository userRepository;
    private final OpenAiService openAiService;

    @Value("${app.upload.dir}")
    private String uploadDir;

    @Transactional
    public ResumeDto uploadResume(String email, MultipartFile file) throws IOException {
        User user = getUser(email);

        // Validate file type
        String contentType = file.getContentType();
        if (!isPdfOrDocx(contentType, file.getOriginalFilename())) {
            throw new IllegalArgumentException("Only PDF and DOCX files are supported");
        }

        // Save file to disk
        String storedFileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        Path uploadPath = Paths.get(uploadDir);
        Files.createDirectories(uploadPath);
        Path filePath = uploadPath.resolve(storedFileName);
        Files.write(filePath, file.getBytes());

        // Extract text
        String extractedText = extractText(file, contentType);

        // Create resume record
        Resume resume = Resume.builder()
                .user(user)
                .originalFileName(file.getOriginalFilename())
                .storedFileName(storedFileName)
                .filePath(filePath.toString())
                .fileType(contentType)
                .fileSize(file.getSize())
                .extractedText(extractedText)
                .status(Resume.ResumeStatus.UPLOADED)
                .build();

        Resume saved = resumeRepository.save(resume);
        return ResumeDto.from(saved);
    }

    @Transactional
    public ResumeDto analyzeResume(String email, Long resumeId) {
        User user = getUser(email);
        Resume resume = resumeRepository.findByIdAndUser(resumeId, user)
                .orElseThrow(() -> new IllegalArgumentException("Resume not found"));

        if (resume.getExtractedText() == null || resume.getExtractedText().isBlank()) {
            throw new IllegalArgumentException("Resume text could not be extracted");
        }

        resume.setStatus(Resume.ResumeStatus.PROCESSING);
        resumeRepository.save(resume);

        try {
            String analysis = openAiService.analyzeResume(resume.getExtractedText());
            resume.setAiAnalysis(analysis);
            resume.setAiScore(extractScoreFromAnalysis(analysis));
            resume.setStatus(Resume.ResumeStatus.ANALYZED);
            resume.setAnalyzedAt(LocalDateTime.now());
        } catch (Exception e) {
            resume.setStatus(Resume.ResumeStatus.FAILED);
            log.error("Analysis failed for resume {}: {}", resumeId, e.getMessage());
            throw new RuntimeException("Analysis failed: " + e.getMessage());
        }

        return ResumeDto.from(resumeRepository.save(resume));
    }

    @Transactional
    public String chatWithResume(String email, Long resumeId, String question) {
        User user = getUser(email);
        Resume resume = resumeRepository.findByIdAndUser(resumeId, user)
                .orElseThrow(() -> new IllegalArgumentException("Resume not found"));

        if (resume.getExtractedText() == null) {
            throw new IllegalArgumentException("Resume text not available");
        }

        return openAiService.chatWithResume(resume.getExtractedText(), question);
    }

    public List<ResumeDto> getUserResumes(String email) {
        User user = getUser(email);
        return resumeRepository.findByUserOrderByUploadedAtDesc(user)
                .stream()
                .map(ResumeDto::from)
                .collect(Collectors.toList());
    }

    public ResumeDto getResume(String email, Long resumeId) {
        User user = getUser(email);
        Resume resume = resumeRepository.findByIdAndUser(resumeId, user)
                .orElseThrow(() -> new IllegalArgumentException("Resume not found"));
        return ResumeDto.from(resume);
    }

    @Transactional
    public void deleteResume(String email, Long resumeId) {
        User user = getUser(email);
        Resume resume = resumeRepository.findByIdAndUser(resumeId, user)
                .orElseThrow(() -> new IllegalArgumentException("Resume not found"));

        // Delete file from disk
        try {
            Files.deleteIfExists(Paths.get(resume.getFilePath()));
        } catch (IOException e) {
            log.warn("Could not delete file: {}", resume.getFilePath());
        }

        resumeRepository.delete(resume);
    }

    // ===== Private Helpers =====

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }

    private boolean isPdfOrDocx(String contentType, String filename) {
        if (contentType != null) {
            return contentType.equals("application/pdf") ||
                   contentType.equals("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        }
        if (filename != null) {
            return filename.endsWith(".pdf") || filename.endsWith(".docx");
        }
        return false;
    }

    private String extractText(MultipartFile file, String contentType) throws IOException {
        if (contentType != null && contentType.equals("application/pdf")) {
            return extractPdfText(file);
        } else {
            return extractDocxText(file);
        }
    }

   public String extractText(MultipartFile file)
        throws IOException {

    try (InputStream inputStream =file.getInputStream();
        try (PDDocument document =Loader.loadPDF(file.getBytes())) {
      PDFTextStripper stripper = new PDFTextStripper();
    return stripper.getText(document);
}
}

    private String extractDocxText(MultipartFile file) throws IOException {
        try (XWPFDocument document = new XWPFDocument(file.getInputStream());
             XWPFWordExtractor extractor = new XWPFWordExtractor(document)) {
            return extractor.getText();
        }
    }
private String extractPdfText(MultipartFile file) throws IOException {
    try (PDDocument document =
             PDDocument.load(file.getInputStream())) {

        PDFTextStripper stripper = new PDFTextStripper();
        return stripper.getText(document);
    }
}
    private String extractScoreFromAnalysis(String analysis) {
        try {
            int idx = analysis.indexOf("\"overallScore\"");
            if (idx >= 0) {
                String sub = analysis.substring(idx + 15).trim();
                if (sub.startsWith(":")) {
                    sub = sub.substring(1).trim();
                    StringBuilder sb = new StringBuilder();
                    for (char c : sub.toCharArray()) {
                        if (Character.isDigit(c)) sb.append(c);
                        else if (!sb.isEmpty()) break;
                    }
                    return sb.toString();
                }
            }
        } catch (Exception e) {
            log.warn("Could not extract score from analysis");
        }
        return null;
    }
}
