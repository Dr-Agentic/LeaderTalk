# Training System Architecture Refactor

## Issue: Critical Architecture Violations in Training Routes

### **🚨 Problem Statement**
The training system implementation in `server/routes/training.ts` violates established architectural patterns, creating a 400+ line monolithic file that mixes concerns and breaks project standards.

### **📊 Severity Assessment: 8/10**
- **Single file contains:** Route definitions, business logic, database queries, file operations, recommendation algorithms
- **Violates:** Handler/Controller separation pattern used throughout codebase
- **Impact:** Untestable, unmaintainable, inconsistent with project architecture

## **🏗️ Required Refactoring**

### **Current Violations**
```typescript
// ❌ WRONG: 400+ lines in routes/training.ts
app.get("/api/training/next-situation-direct", requireAuth, async (req, res) => {
  // 80 lines of complex business logic, database queries, file operations
  const userId = req.session.userId;
  const allSituationIds = [];
  // ... massive algorithm in route handler
});
```

### **Target Architecture**
```typescript
// ✅ CORRECT: Clean separation following project patterns
routes/training.ts (30 lines)
├── controllers/trainingController.ts (request/response handling)
├── services/trainingService.ts (business logic)
├── handlers/trainingDataHandler.ts (file operations)
└── services/recommendationEngine.ts (algorithm logic)
```

## **📋 Refactoring Tasks**

### **Phase 1: Extract Core Services (Priority 1)**

#### **1.1 Create TrainingController**
- [ ] `server/controllers/trainingController.ts`
- [ ] Follow pattern from `mobileSubscriptionController.ts`
- [ ] Handle request/response, delegate to services
- [ ] Max 15 lines per method

#### **1.2 Create RecommendationEngine**
- [ ] `server/services/recommendationEngine.ts`
- [ ] Extract 80-line algorithm from route handler
- [ ] Methods: `findNextIncompleteExercise()`, `calculateUserProgress()`
- [ ] Pure business logic, no HTTP dependencies

#### **1.3 Create TrainingDataHandler**
- [ ] `server/handlers/trainingDataHandler.ts`
- [ ] Extract `loadChapterData()` and file operations
- [ ] Follow pattern from existing handlers
- [ ] Caching and error handling for JSON files

### **Phase 2: Service Layer (Priority 2)**

#### **2.1 Create TrainingService**
- [ ] `server/services/trainingService.ts` (enhance existing)
- [ ] Move progress calculation logic
- [ ] Move statistics aggregation
- [ ] Coordinate between data handler and recommendation engine

#### **2.2 Create TrainingStatsService**
- [ ] `server/services/trainingStatsService.ts`
- [ ] Extract module/chapter statistics logic
- [ ] Complex database aggregations
- [ ] Performance optimization for stats queries

### **Phase 3: Clean Routes (Priority 3)**

#### **3.1 Refactor Route Handlers**
- [ ] Reduce `routes/training.ts` to 30 lines
- [ ] Each route: 3-5 lines maximum
- [ ] Only HTTP concerns (auth, params, response)
- [ ] Delegate everything to controller

## **🎯 Implementation Guidelines**

### **Function Length Standards**
- **Route handlers:** 3-5 lines (HTTP only)
- **Controller methods:** 10-15 lines (orchestration)
- **Service methods:** 20-40 lines (business logic)
- **Handler methods:** 10-25 lines (data operations)

### **Naming Conventions**
- **Controllers:** `getNextSituationRecommendation()`, `submitTrainingResponse()`
- **Services:** `findNextIncompleteExercise()`, `calculateModuleStats()`
- **Handlers:** `loadChapterData()`, `saveUserProgress()`

### **Separation of Concerns**
```typescript
// Route: HTTP only
app.get("/api/training/next-situation", requireAuth, (req, res) => {
  trainingController.getNextSituationRecommendation(req, res);
});

// Controller: Request/Response handling
async getNextSituationRecommendation(req, res) {
  const userId = req.session.userId;
  const recommendation = await this.trainingService.findNextExercise(userId);
  res.json(recommendation);
}

// Service: Business logic
async findNextExercise(userId) {
  const situations = await this.dataHandler.loadAllSituations();
  const progress = await this.getUserProgress(userId);
  return this.recommendationEngine.getNext(situations, progress);
}
```

## **📚 Reference Implementations**

### **Follow These Patterns**
- `controllers/mobileSubscriptionController.ts` - Clean controller pattern
- `services/revenueCatPaymentHandler.ts` - Proper handler separation
- `controllers/subscriptionPlansController.ts` - Service delegation

### **Architecture Principles**
- **Single Responsibility:** Each class has one reason to change
- **Dependency Injection:** Services injected into controllers
- **Testability:** Each layer can be unit tested independently
- **Reusability:** Business logic can be used outside HTTP context

## **🧪 Testing Requirements**

### **Unit Tests Required**
- [ ] `RecommendationEngine.test.ts` - Algorithm logic
- [ ] `TrainingService.test.ts` - Business logic
- [ ] `TrainingDataHandler.test.ts` - File operations
- [ ] `TrainingController.test.ts` - HTTP handling

### **Integration Tests**
- [ ] End-to-end training flow
- [ ] Database integration
- [ ] File system operations
- [ ] Error handling scenarios

## **⚡ Success Criteria**

### **Code Quality Metrics**
- [ ] `routes/training.ts` reduced to <50 lines
- [ ] No function >40 lines
- [ ] Each class has single responsibility
- [ ] 100% test coverage on business logic

### **Architecture Compliance**
- [ ] Follows existing controller/service/handler pattern
- [ ] No business logic in route handlers
- [ ] No HTTP dependencies in services
- [ ] Clean dependency injection

### **Maintainability Improvements**
- [ ] New recommendation strategies can be added without touching routes
- [ ] Business logic can be tested independently
- [ ] Code is self-documenting with clear naming
- [ ] New developers can easily understand structure

## **⏱️ Timeline & Priority**

**Estimated Effort:** 2-3 days
**Priority:** High (architectural debt)
**Blocker:** None - can be done incrementally

**Day 1:** Extract RecommendationEngine and TrainingController
**Day 2:** Create service layer and data handler
**Day 3:** Clean routes and add tests

## **🔍 Validation Checklist**

### **Before Merge**
- [ ] All existing tests pass
- [ ] New unit tests for extracted services
- [ ] No regression in API functionality
- [ ] Code review confirms architectural compliance
- [ ] Performance benchmarks maintained

### **Architecture Review**
- [ ] Follows established patterns
- [ ] Single responsibility principle enforced
- [ ] Proper separation of concerns
- [ ] Testable and maintainable code structure

---

**Goal:** Transform monolithic route file into clean, testable, maintainable architecture that follows project standards and enables future enhancements.

**Reference:** This refactor should make the training system architecture consistent with the high-quality patterns used in `mobileSubscriptionController.ts` and other well-structured parts of the codebase.
