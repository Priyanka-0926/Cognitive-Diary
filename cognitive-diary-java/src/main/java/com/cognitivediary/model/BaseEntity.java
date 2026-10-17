package com.cognitivediary.model;

import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;

/**
 * BaseEntity demonstrating Inheritance, Encapsulation, and Polymorphism.
 * All domain entities extend this class.
 */
public abstract class BaseEntity implements Serializable, Comparable<BaseEntity> {
    private static final long serialVersionUID = 1L;

    protected String id;
    protected String createdAt;
    protected String updatedAt;

    public BaseEntity() {
        this.createdAt = Instant.now().toString();
        this.updatedAt = Instant.now().toString();
    }

    public BaseEntity(String id) {
        this();
        this.id = id;
    }

    public BaseEntity(String id, String createdAt, String updatedAt) {
        this.id = id;
        this.createdAt = createdAt != null ? createdAt : Instant.now().toString();
        this.updatedAt = updatedAt != null ? updatedAt : Instant.now().toString();
    }

    // Abstract method demonstrating Polymorphism in derived subclasses
    public abstract String getEntitySummary();

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public String getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(String updatedAt) {
        this.updatedAt = updatedAt;
    }

    public void touch() {
        this.updatedAt = Instant.now().toString();
    }

    @Override
    public int compareTo(BaseEntity o) {
        if (o == null || o.createdAt == null) return 1;
        if (this.createdAt == null) return -1;
        return this.createdAt.compareTo(o.createdAt);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        BaseEntity that = (BaseEntity) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
