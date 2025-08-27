package controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import entities.Message;
import service.MessageService;

@RestController
@CrossOrigin(origins = "http://localhost:3000",allowedHeaders = "*")
public class AdminController {
	
    public AdminController(MessageService messageService) {
		this.messageService = messageService;
	}
	private final MessageService messageService;    
     @GetMapping("/allmessages")
     public ResponseEntity<List<Message>> getAllMessages (Authentication auth){
       List<Message>messages = messageService.getAllMessages();
       return ResponseEntity.ok(messages);
     }
    
    
    
}
