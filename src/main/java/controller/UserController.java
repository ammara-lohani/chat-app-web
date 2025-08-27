package controller;

import java.util.List;
import entities.User.Role;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;
import dto.LoginResponse;
import dto.LoginUser;
import entities.User;
import repository.UserRepository;
import service.JwtService;
import service.MessageService;
import entities.Message;
import service.UserService;
@CrossOrigin(origins = "http://localhost:3000",allowedHeaders = "*")
@RestController
public class UserController {

	private final UserRepository userRepository;
	private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private  final UserService userService; // your service to load User entity
    public UserController(MessageService messageService, UserRepository userRepository, JwtService jwtService, AuthenticationManager authenticationManager, UserService userService) {
        this.userRepository = userRepository;
        this.messageService= messageService;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.userService = userService;
    }
    
    private final MessageService messageService;
	// for register 
	@PostMapping("/user/register")
	public ResponseEntity<String> saveUser(@RequestBody User user) { 
	    try {
	        if (user.getRole() == null) {
	            user.setRole(User.Role.USER);
	        }
	        User savedUser = userRepository.save(user);
	        return ResponseEntity.ok("User registered successfully with ID: " + savedUser.getId());
	    } catch (Exception e) {
	        e.printStackTrace();
	        return ResponseEntity.status(500).body("Error: " + e.getMessage());
	    }
	}
	
	// search by email
	@GetMapping("/dropdown")
	public ResponseEntity<List<User>> getAllUser( Authentication auth) {
	   List <User> userrole= userService.getByRole(Role.USER);
		
	    if (!userrole.isEmpty()) {
	    	return ResponseEntity.ok(userrole);
	    }
	    System.out.println("User not found");
	    return ResponseEntity.notFound().build();
	}
	
	//post for login
	@PostMapping("/login")
	public ResponseEntity<?> login(@RequestBody LoginUser request) {
	    try {
	        User user = userService.findByEmail(request.getEmail());
	        if (user == null) {
	            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Email doesn't align with any account");
	        }

	        Role requestedRole = request.getRole();
	        if (requestedRole != null && !user.getRole().equals(requestedRole)) {
	            return ResponseEntity.status(HttpStatus.FORBIDDEN)
	                .body("Account doesn't exist with this email ");
	        }

	        try {
	            Authentication authentication = authenticationManager.authenticate(
	                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
	            );
	        } catch (BadCredentialsException e) {
	            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Password is incorrect");
	        }
	        String token = jwtService.generateToken(user);
	        System.out.println("Generated JWT Token: " + token);
	        return ResponseEntity.ok(new LoginResponse(token, user));

	    } catch (Exception e) {
	        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Login error: " + e.getMessage());
	    }
	}


	@GetMapping("/getting/{userId}")
    public List<Message> getLatestChats(@PathVariable Integer userId, Authentication auth ) {
		System.out.println("Authenication for getting "+ auth);
        return messageService.getLatestChats(userId);
    }
	
	
}	