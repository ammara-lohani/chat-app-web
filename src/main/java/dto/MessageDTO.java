package dto;

import java.time.LocalDateTime;

public class MessageDTO {
    private Integer id;
    private String messageText;
    private LocalDateTime sentAt;
    private String status; // Use string to allow easy serialization (e.g., "SENT", "DELIVERED")

    private Integer senderId;
    private Integer receiverId;

    // Constructors
    public MessageDTO() {
    }

    public MessageDTO(Integer id, String messageText, LocalDateTime sentAt, String status, Integer senderId, Integer receiverId) {
        this.id = id;
        this.messageText = messageText;
        this.sentAt = sentAt;
        this.status = status;
        this.senderId = senderId;
        this.receiverId = receiverId;
    }

    // Getters and setters
    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getMessageText() {
        return messageText;
    }

    public void setMessageText(String messageText) {
        this.messageText = messageText;
    }

    public LocalDateTime getSentAt() {
        return sentAt;
    }

    public void setSentAt(LocalDateTime sentAt) {
        this.sentAt = sentAt;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getSenderId() {
        return senderId;
    }

    public void setSenderId(Integer senderId) {
        this.senderId = senderId;
    }

    public Integer getReceiverId() {
        return receiverId;
    }

    public void setReceiverId(Integer receiverId) {
        this.receiverId = receiverId;
    }
}


