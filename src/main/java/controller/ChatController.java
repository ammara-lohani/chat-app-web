package controller;
import java.time.LocalDateTime;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.ResponseEntity.BodyBuilder;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import dto.MessageDTO;
import dto.UserDetail;
import entities.Message;
import entities.Message.Status;
import entities.User;
import repository.MessageRepository;
import service.MessageService;
import service.UserService;
@Controller
@CrossOrigin(origins = "http://localhost:3000")
@RestController
public class ChatController {
	public ChatController(MessageRepository messageRepository, MessageService messageService, UserService userService) {
		this.messageService = messageService;
		this.userService =userService ;
	}
	@Autowired
	private SimpMessagingTemplate messagingTemplate;
	private final MessageService messageService; 
	private final UserService userService; 
	
	@MessageMapping("/sendMessage")
	public void sendMessage(MessageDTO dto) {
	    try {
	        // Validate
	        if (dto.getSenderId() == null || dto.getReceiverId() == null) {
	            throw new IllegalArgumentException("SenderId and ReceiverId are required");
	        }
	        if (dto.getMessageText() == null || dto.getMessageText().trim().isEmpty()) {
	            throw new IllegalArgumentException("Message text cannot be empty");
	        }

	        // Map DTO → Entity
	        User sender = userService.findById(dto.getSenderId());
	        User receiver = userService.findById(dto.getReceiverId());

	        Message message = new Message();
	        message.setSender(sender);
	        message.setReceiver(receiver);
	        message.setMessageText(dto.getMessageText());
	        message.setSentAt(LocalDateTime.now());
	        message.setStatus(Status.SENT);

	        // Save
	        Message saved = messageService.saveMessage(message);

	        if (dto.getStatus() != null) {
	            message.setStatus(Status.valueOf(dto.getStatus().toUpperCase()));
	        } else {
	            message.setStatus(Status.SENT); // default if no status is provided
	        }
	        // Build DTO response
	        MessageDTO response = new MessageDTO(
	                saved.getId(),
	                saved.getMessageText(),
	                saved.getSentAt(),
	                saved.getStatus().name(),
	                saved.getSender().getId(),
	                saved.getReceiver().getId()
	        );

	        //  Send to specific receiver
	        messagingTemplate.convertAndSendToUser(
	                dto.getReceiverId().toString(),
	                "/queue/messages",
	                response
	        );

	        // 🔹 Also broadcast (optional)
	        messagingTemplate.convertAndSend("/topic/message", response);

	    } catch (Exception e) {
	        System.err.println("Error processing message: " + e.getMessage());
	        throw e;
	    }
	}
    
    // REST endpoint to get chat history
    @GetMapping("/api/messages/chat/{userId1}/{userId2}")
    public ResponseEntity<List<Message>> getChatHistory(
        @PathVariable Integer userId1,  
        @PathVariable Integer userId2,
        Authentication authentication
         ) { 
    	System.out.println("Authentication object: " + authentication);
        List<Message> messages = messageService.getChatHistory(userId1, userId2);
        System.out.println("Fetching chat between " + userId1 + " and " + userId2);
        System.out.println("Messages found: " + messages.size()); 
        return ResponseEntity.ok(messages);
    }

    @GetMapping("/details/{userId}")
    public ResponseEntity<?> getUserDetails(@PathVariable Integer userId, Authentication auth ) {
        try {
            // Find user by ID
            User user = userService.findByIdDetail(userId);
            
            if (user == null) {
                return ((BodyBuilder) ResponseEntity.notFound())
                    .body("User not found with ID: " + userId);
            }

            // Create response DTO to avoid exposing sensitive data
            UserDetail userDetails = new UserDetail();
            userDetails.setId(user.getId());
            userDetails.setName(user.getName());
            userDetails.setEmail(user.getEmail());
            // Don't include password or other sensitive fields
            
            return ResponseEntity.ok(userDetails);
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body("Error fetching user details: " + e.getMessage());
        }
    }
    //@PutMapping("/{id}/seen")
    public ResponseEntity<String> markAsSeen(@PathVariable Integer id) {
        messageService.markMessageAsSeen(id);
        return ResponseEntity.ok("Message as seen");
    }
    
    
 }