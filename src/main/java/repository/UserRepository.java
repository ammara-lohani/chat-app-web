package repository;

import java.util.Optional;
import entities.User.Role;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import entities.User;

@Repository
public interface UserRepository extends JpaRepository<User, Integer >{
	 Optional<User> findByEmail (String email);
	 Optional<User> searchByEmail (String email);
	 Optional <User> findById (Integer id);
	 @Query("""
			    SELECT u FROM User u WHERE u.id = :userid
			    """)
			Optional<User> findUserById(@Param("userid") Integer id);
	 List<User> findByRole(Role role);
}
