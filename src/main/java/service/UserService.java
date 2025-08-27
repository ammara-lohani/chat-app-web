package service;

import org.springframework.stereotype.Service;
import entities.User;
import java.util.List;
import java.util.Optional;
import entities.User.Role;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import repository.UserRepository;

@Service
public class UserService implements UserDetailsService {
	
	public UserService(UserRepository userRespository) {
		this.userRespository = userRespository;
	}

	private final UserRepository userRespository;

	 public User findByEmail(String email) {
	        return userRespository.findByEmail(email)
	                .orElse(null);  // or throw exception if preferred
	    }
	 public Optional<User> searchUserByEmail(String email) {
		    System.out.println("Searching for email: " + email);
		    Optional<User> result = userRespository.searchByEmail(email);
		    System.out.println("Found user: " + result.isPresent());
		    return result;
		}
	 public User findById(Integer id) {
		    return userRespository.findById(id)
		            .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
		}
	 public User findByIdDetail(Integer id) {
		    return userRespository.findById(id)
		            .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
		}

	 public List<User> getByRole(Role role){
		 return userRespository.findByRole(role);
	 }
	 @Override
	 public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
		 var user = userRespository.findByEmail(email).orElseThrow(
		            () -> new UsernameNotFoundException("Email not found")
		        );
		 
		  List<GrantedAuthority> authorities = List.of(
				  new SimpleGrantedAuthority("ROLE_" + user.getRole().name())
				  );
		  
		  return new org.springframework.security.core.userdetails.User(
		            user.getEmail(),
		            user.getPassword(),
		            authorities
		        );
	 }
}
