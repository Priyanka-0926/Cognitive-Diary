package com.cognitivediary.repository;

import com.cognitivediary.model.BaseEntity;

import java.util.List;
import java.util.Optional;

/**
 * Generic repository interface demonstrating Java Generics & Collections.
 *
 * @param <T>  the entity type extending BaseEntity
 * @param <ID> the identifier type
 */
public interface CrudRepository<T extends BaseEntity, ID> {

    T save(T entity);

    Optional<T> findById(ID id);

    List<T> findAll();

    boolean deleteById(ID id);

    long count();

    boolean existsById(ID id);
}
