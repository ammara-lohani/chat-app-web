package repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import entities.Message;

@Repository
public interface MessageRepository extends JpaRepository<Message, Integer > {
	@Query("SELECT m FROM Message m WHERE " +
		       "(m.sender.id = :senderId AND m.receiver.id = :receiverId) OR " +
		       "(m.sender.id = :receiverId AND m.receiver.id = :senderId) " +
		       "ORDER BY m.sentAt ASC")
		List<Message> findChatHistory(@Param("senderId") Integer senderId,
		                              @Param("receiverId") Integer receiverId);

		@Query("SELECT m FROM Message m WHERE " +
		       "m.sender.id = :userId OR m.receiver.id = :userId " +
		       "ORDER BY m.sentAt DESC")
		List<Message> findAllMessagesForUser(@Param("userId") Integer userId);

		@Query("SELECT m FROM Message m WHERE " +
		       "m.receiver.id = :userId AND m.status != 'READ' " +
		       "ORDER BY m.sentAt DESC")
		List<Message> findUnreadMessages(@Param("userId") Integer userId);
		
		@Query("""
			    SELECT m FROM Message m
			    WHERE m.id IN (
			        SELECT sub.id FROM Message sub
			        WHERE sub.sender.id = :userId OR sub.receiver.id = :userId
			        AND sub.sentAt = (
			            SELECT MAX(sub2.sentAt)
			            FROM Message sub2
			            WHERE (sub2.sender.id = :userId AND sub2.receiver.id = 
			                   CASE WHEN sub.sender.id = :userId THEN sub.receiver.id ELSE sub.sender.id END)
			               OR (sub2.receiver.id = :userId AND sub2.sender.id = 
			                   CASE WHEN sub.receiver.id = :userId THEN sub.sender.id ELSE sub.receiver.id END)
			        )
			    )
			    ORDER BY m.sentAt DESC
			""")
			List<Message> findLatestMessagePerChatPartner(@Param("userId") Integer userId);

		// for admin panel 
		@Query("""
			    SELECT m FROM Message m
			    ORDER BY m.sentAt DESC
			""")
			List<Message> findAllMessages();

}