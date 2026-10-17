package com.cognitivediary.repository;

import com.cognitivediary.model.JournalEntryEntity;

import java.util.List;

/**
 * JournalRepository demonstrating interface inheritance and specialized query methods.
 */
public interface JournalRepository extends CrudRepository<JournalEntryEntity, String> {

    List<JournalEntryEntity> findByUserId(String userId);

    List<JournalEntryEntity> searchByKeyword(String userId, String keyword);

    List<JournalEntryEntity> findByUserIdAndEntryDate(String userId, String entryDate);

    boolean deleteByUserIdAndId(String userId, String id);
}
