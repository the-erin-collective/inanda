# Product Requirements Document - Core

*Last Updated: June 8, 2025*

## 📖 How to Use This Document

### For AI Agents
This is the **core PRD** - your primary reference for project overview, objectives, and development workflow. For architectural constraints, refer to `PRD-Architecture.md`. For detailed technical specifications, refer to `PRD-Technical-Specs.md`.

**Checkbox Management:**
- `[ ]` = Task not started
- `[x]` = Task completed  
- Update checkboxes as you progress through tasks
- Never mark a checkbox complete without actually implementing the feature
- Use checkboxes to track your progress across multiple sessions

**Workflow Adherence:**
1. Use the ./llms/llms.txt file as an entry point for discovering technical constraints and for context on the packages used.
2. Always follow the 6-step workflow (Plan → Analyze → Approve → Implement → Validate → Complete)
3. Never skip the "Analyze" step - constraint violations are project failures
4. Reference the appropriate technical documents during analysis
5. Check the architecture guide before implementing any patterns

---

## 🗂️ Document Navigation Guide

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **PRD-Core.md** (this file) | Project overview, objectives, development checklist | Always start here, project planning |
| **PRD-Architecture.md** | Clean architecture patterns, constraints, file organization | During "ANALYZE" step of workflow, architecture questions |
| **PRD-Technical-Specs.md** | Babylon.js integration, JSON data structures, rendering specs | During implementation, specific technical questions |
| **llms.txt** | Central context file for specifications on the underlying tech stack to be used by LLM agents working on this project | Always use this when making or designing implementation changes for how to implement things. |

---

## 🎯 Project Vision

### Primary Purpose
A **revolutionary web development platform** that demonstrates a new paradigm for creating websites by:
- Using Babylon.js 3D engine as the primary rendering system
- Storing content as structured JSON instead of HTML/CSS
- Translating JSON data into 3D-rendered layouts and interactive experiences
- Serving as both a technical demonstration and personal portfolio platform

### Evolution Timeline
1. **Phase 1 (Current)**: Technical demonstration + personal portfolio
2. **Phase 2 (Medium-term)**: GUI website builder for custom site creation
3. **Phase 3 (Long-term)**: 3D/VR social network with immersive profile sites

### Core Innovation
**Reinventing the web stack** by replacing HTML/CSS with JSON + 3D rendering:
- Freedom from HTML/CSS backwards compatibility constraints
- Enhanced aesthetic possibilities (animations, shaders, mini-games)
- Scraping protection through canvas-based rendering
- Consistent rendering regardless of browser standard changes

---

## 👥 Target Users

### Primary Audience
**Creative professionals and individuals** seeking unique portfolio/profile sites:
- Developers showcasing technical skills
- Artists wanting rich visual presentations
- Anyone seeking creative expression beyond traditional web limitations

### User Journey
1. **Phase 1**: Clone repository → Run on personal server → Explore demo site
2. **Phase 2**: Sign in → Use GUI builder → Design custom site → Publish
3. **Phase 3**: Create 3D/VR profile spaces → Social networking in immersive environments

---

## 🔧 Core Features & Development Checklist

### 🏗️ Foundation Systems

#### Site Data Management System
- [ ] **PLAN**: Design JSON schema for site/page data structures
- [ ] **ANALYZE**: Verify schema supports all required layout types *(check PRD-Technical-Specs.md)*
- [ ] **APPROVE**: Schema architecture approved
- [ ] **IMPLEMENT**: JSON data models and validation
- [ ] **VALIDATE**: Test schema with complex site structures
- [ ] **COMPLETE**: Site data system operational

#### MongoDB Integration
- [ ] **PLAN**: Design database schema for multi-site storage
- [ ] **ANALYZE**: Verify clean architecture compliance *(check PRD-Architecture.md)*
- [ ] **APPROVE**: Database design approved
- [ ] **IMPLEMENT**: Repository pattern with MongoDB
- [ ] **VALIDATE**: Test CRUD operations for sites/pages
- [ ] **COMPLETE**: Database integration functional

### 🎨 Babylon.js Rendering Engine

#### JSON-to-3D Translation Engine
- [ ] **PLAN**: Design translation layer architecture
- [ ] **ANALYZE**: Verify rendering performance requirements *(check PRD-Technical-Specs.md)*
- [ ] **APPROVE**: Translation engine design approved
- [ ] **IMPLEMENT**: JSON → Babylon.js component converter
- [ ] **VALIDATE**: Test rendering accuracy and performance
- [ ] **COMPLETE**: Translation engine operational

#### Hexagonal Site Navigation
- [ ] **PLAN**: Design hex-flower navigation system
- [ ] **ANALYZE**: Verify 3D navigation patterns *(check PRD-Technical-Specs.md)*
- [ ] **APPROVE**: Navigation UX approved
- [ ] **IMPLEMENT**: Hex-based site map with smooth transitions
- [ ] **VALIDATE**: Test navigation responsiveness and usability
- [ ] **COMPLETE**: Navigation system complete

#### Page Rendering System
- [ ] **PLAN**: Design individual page layout engine
- [ ] **ANALYZE**: Verify component rendering architecture
- [ ] **APPROVE**: Page rendering design approved
- [ ] **IMPLEMENT**: Page-specific content rendering
- [ ] **VALIDATE**: Test complex page layouts
- [ ] **COMPLETE**: Page rendering system functional

### 🌐 Core Web Application

#### Angular Universal SSR
- [ ] **PLAN**: Design SSR implementation strategy
- [ ] **ANALYZE**: Verify SSR compatibility with Babylon.js *(check PRD-Technical-Specs.md)*
- [ ] **APPROVE**: SSR architecture approved
- [ ] **IMPLEMENT**: Server-side rendering setup
- [ ] **VALIDATE**: Test SSR performance and SEO compatibility
- [ ] **COMPLETE**: SSR implementation complete

#### Routing System
- [ ] **PLAN**: Design site/page routing architecture
- [ ] **ANALYZE**: Verify routing supports multi-site structure
- [ ] **APPROVE**: Routing design approved
- [ ] **IMPLEMENT**: Angular routing for sites and pages
- [ ] **VALIDATE**: Test deep linking and navigation
- [ ] **COMPLETE**: Routing system operational

#### Data Seeding System
- [ ] **PLAN**: Design demo site seeding strategy
- [ ] **ANALYZE**: Verify seed data represents full feature set
- [ ] **APPROVE**: Seeding approach approved
- [ ] **IMPLEMENT**: Seed scripts for demo content
- [ ] **VALIDATE**: Test seed data creates functional demo site
- [ ] **COMPLETE**: Seeding system ready

### 🔒 Security & Performance

#### Canvas-Based Scraping Protection
- [ ] **PLAN**: Design content protection strategy
- [ ] **ANALYZE**: Verify protection effectiveness
- [ ] **APPROVE**: Protection approach approved
- [ ] **IMPLEMENT**: Canvas-only rendering (no DOM content)
- [ ] **VALIDATE**: Test scraping protection effectiveness
- [ ] **COMPLETE**: Content protection active

#### Performance Optimization
- [ ] **PLAN**: Design performance monitoring strategy
- [ ] **ANALYZE**: Identify performance bottlenecks *(check PRD-Technical-Specs.md)*
- [ ] **APPROVE**: Optimization approach approved
- [ ] **IMPLEMENT**: Performance optimizations
- [ ] **VALIDATE**: Verify performance targets met
- [ ] **COMPLETE**: Performance optimization complete

---

## 🚀 Success Criteria

### Phase 1 Completion Metrics
- [ ] Demo site loads and displays correctly
- [ ] Hexagonal navigation functions smoothly
- [ ] Individual pages render from JSON data
- [ ] Site data stored/retrieved from MongoDB
- [ ] Performance acceptable on target devices
- [ ] Scraping protection verified functional

### Technical Achievements
- [ ] Successful JSON → 3D rendering translation
- [ ] Stable Babylon.js integration with Angular
- [ ] Clean architecture maintained throughout
- [ ] Modern cutting-edge tech stack implemented
- [ ] SSR compatibility with 3D rendering

---

## 📋 Current Implementation Status

### Completed Infrastructure
- [x] Angular 20 + Babylon.js 8.4 setup
- [x] Clean architecture folder structure
- [x] MongoDB integration foundation
- [x] Basic routing structure

### In Progress
- [ ] JSON data schema definition
- [ ] Babylon.js rendering engine integration
- [ ] Site data translation layer

### Upcoming
- [ ] Hexagonal navigation system
- [ ] Demo site implementation
- [ ] Performance optimization

---

*For architectural constraints and patterns, see [PRD-Architecture.md](./PRD-Architecture.md)*
*For technical implementation details, see [PRD-Technical-Specs.md](./PRD-Technical-Specs.md)*
