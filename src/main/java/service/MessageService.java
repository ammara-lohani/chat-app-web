package service;

import java.util.List;

import org.springframework.stereotype.Service;

import entities.Message;
import entities.Message.Status;
import repository.MessageRepository;

@Service
public class MessageService {
    private final MessageRepository messageRepository;

    public MessageService(MessageRepository messageRepository) {
        this.messageRepository = messageRepository;
    }

    public Message saveMessage(Message message) {
        return messageRepository.save(message);
    }

    public List<Message> getChatHistory(Integer senderId, Integer receiverId) {
        return messageRepository.findChatHistory(senderId, receiverId);
    }

    public List<Message> getAllMessagesForUser(Integer userId) {  // Changed from Long to Integer
        return messageRepository.findAllMessagesForUser(userId);
    }

    public void markMessageAsSeen(Integer messageId) {
        Message message = messageRepository.findById(messageId)
            .orElseThrow(() -> new RuntimeException("Message not found"));
        message.setStatus(Status.SEEN);
        messageRepository.save(message);
    }
    
    public List<Message> getLatestChats(Integer userId) {
        return messageRepository.findLatestMessagePerChatPartner(userId);
    }
    
    // for admin 
    public List<Message> getAllMessages(){
    	return messageRepository.findAllMessages();
    }
}