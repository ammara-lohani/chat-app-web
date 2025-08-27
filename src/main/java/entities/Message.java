package entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})

@Entity
@Table(name = "messages")
public class Message {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "message_text", nullable = false)
    private String messageText;

    @Column(name = "sent_at", nullable = false)
    private LocalDateTime sentAt = LocalDateTime.now();

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private Status status = Status.SENT;

    public enum Status {
        SENT, DELIVERED, SEEN
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id")
    private User sender;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiver_id")
    private User receiver;

    public Message() {}

    public Message(Integer id, String messageText, User sender, User receiver, Status status) {
        this.id = id;
        this.messageText = messageText;
        this.sender = sender;
        this.receiver = receiver;
        this.status = status;
        this.sentAt = LocalDateTime.now();
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

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public User getSender() {
        return sender;
    }

    public void setSender(User sender) {
        this.sender = sender;
    }

    public User getReceiver() {
        return receiver;
    }

    public void setReceiver(User receiver) {
        this.receiver = receiver;
    }
 // Add these to Message.java
    public Integer getSenderId() {
        return sender != null ? sender.getId() : null;
    }

    public void setSenderId(Integer senderId) {
        // This will be used during JSON deserialization
        if (this.sender == null) {
            this.sender = new User();
        }
        this.sender.setId(senderId);
    }

    public Integer getReceiverId() {
        return receiver != null ? receiver.getId() : null;
    }

    public void setReceiverId(Integer receiverId) {
        // This will be used during JSON deserialization  
        if (this.receiver == null) {
            this.receiver = new User();
        }
        this.receiver.setId(receiverId);
    }
	
}
