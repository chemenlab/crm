# Implementation Plan: Редизайн публичной страницы мастера

## Overview

Поэтапная реализация редизайна публичной страницы мастера с современным glass morphism дизайном, системой портфолио и улучшенным UX онлайн-записи. Задачи организованы в логическом порядке для инкрементальной разработки.

## Tasks

- [x] 1. Database setup and migrations
  - Create migration for extending users table with new fields
  - Create migration for portfolio_items table
  - Add indexes for performance
  - Run migrations
  - _Requirements: 7, 8, 9_

- [-] 2. Backend: Portfolio models and services
  - [x] 2.1 Create PortfolioItem model
    - Define fillable fields, casts, relationships
    - Add accessor methods for image URLs
    - _Requirements: 7_

  - [ ]* 2.2 Write property test for PortfolioItem model
    - **Property 3: Portfolio sort order uniqueness**
    - **Validates: Requirements 5.5**

  - [x] 2.3 Create PortfolioService for image processing
    - Implement processImage() method with resize and thumbnail generation
    - Implement deleteImage() method
    - Implement checkLimit() method for subscription limits
    - Use Intervention Image library
    - _Requirements: 7.2, 7.3, 7.8_

  - [ ]* 2.4 Write property test for PortfolioService
    - **Property 1: Portfolio limit enforcement**
    - **Property 2: Image processing consistency**
    - **Validates: Requirements 7.2, 7.8**

- [ ] 3. Backend: Portfolio API endpoints
  - [x] 3.1 Create PortfolioController
    - Implement index() - list portfolio items
    - Implement store() - upload new item with limit check
    - Implement update() - update item details
    - Implement destroy() - delete item and files
    - Implement reorder() - update sort_order
    - _Requirements: 7_

  - [ ] 3.2 Create PortfolioRequest for validation
    - Validate image file (type, size, dimensions)
    - Validate title, description, tag
    - _Requirements: 7.10_

  - [ ]* 3.3 Write integration tests for Portfolio API
    - Test upload with limit check
    - Test reordering
    - Test deletion with file cleanup
    - _Requirements: 7_

  - [x] 3.4 Add portfolio routes to routes/web.php
    - GET /api/portfolio
    - POST /api/portfolio
    - PUT /api/portfolio/{id}
    - DELETE /api/portfolio/{id}
    - POST /api/portfolio/reorder
    - _Requirements: 7_

- [ ] 4. Backend: Update BookingController for new data
  - [x] 4.1 Extend show() method to include new fields
    - Add site_bio, site_location
    - Add social links (instagram, vk, telegram, whatsapp)
    - Add gradient colors
    - Add portfolio items with thumbnails
    - _Requirements: 2, 3, 5, 8_

  - [ ]* 4.2 Write property test for public page data
    - **Property 4: Social links visibility**
    - **Property 7: SEO metadata completeness**
    - **Validates: Requirements 3.3, 9.1, 9.2, 9.3**

  - [x] 4.3 Add SEO meta tags and JSON-LD microdata
    - Generate Open Graph tags
    - Generate schema.org LocalBusiness microdata
    - _Requirements: 9_

- [ ] 5. Backend: Settings API for public page
  - [x] 5.1 Update SettingsController
    - Add updatePublicPage() method
    - Validate all new fields
    - _Requirements: 8_

  - [x] 5.2 Add settings routes
    - PUT /api/settings/public-page
    - POST /api/settings/public-page/preview
    - _Requirements: 8_

- [x] 6. Checkpoint - Backend complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Frontend: Core public page components
  - [ ] 7.1 Create FloatingHeader component
    - Avatar, name, share button
    - Glass morphism styling
    - Web Share API with clipboard fallback
    - _Requirements: 1, 11_

  - [ ]* 7.2 Write property test for share functionality
    - **Property 10: Share functionality fallback**
    - **Validates: Requirements 11.3**

  - [ ] 7.3 Create ProfileCard component
    - Large avatar with sparkles icon
    - Name, role, location
    - Floating animation
    - _Requirements: 2_

  - [ ] 7.4 Create BioSection component
    - Display bio text
    - Hide if empty
    - Glass morphism card
    - _Requirements: 2_

  - [ ] 7.5 Create SocialLinks component
    - Grid of 4 social icons
    - Conditional rendering
    - Hover effects
    - _Requirements: 3_

  - [ ] 7.6 Create PhoneCard component
    - Phone number display
    - Call button with tel: link
    - Glass morphism styling
    - _Requirements: 3_

- [ ] 8. Frontend: Services and portfolio components
  - [ ] 8.1 Create ServiceCard component
    - Service name, duration, price
    - Hover effects
    - Click handler for booking
    - _Requirements: 4_

  - [ ] 8.2 Create PortfolioGrid component
    - 2-column grid layout
    - 4:5 aspect ratio
    - Lazy loading
    - _Requirements: 5_

  - [ ] 8.3 Create PortfolioCard component
    - Image with hover zoom
    - Title overlay on hover
    - Glass morphism styling
    - _Requirements: 5_

  - [ ]* 8.4 Write property test for portfolio rendering
    - **Property 8: Responsive image loading**
    - **Validates: Requirements 10.3**

- [x] 9. Frontend: Booking modal with multi-step form
  - [x] 9.1 Create BookingModal component structure
    - Modal container with backdrop
    - Progress bar component
    - Step navigation logic
    - _Requirements: 6_

  - [x] 9.2 Create ServiceStep component
    - List of services
    - Selection handling
    - _Requirements: 6_

  - [x] 9.3 Create DateStep component
    - Calendar component
    - Date selection
    - _Requirements: 6_

  - [x] 9.4 Create TimeStep component
    - Available time slots
    - Time selection
    - Integration with existing slots API
    - _Requirements: 6, 12_

  - [x] 9.5 Create ContactStep component
    - Name and phone inputs
    - Validation
    - _Requirements: 6_

  - [x] 9.6 Create SuccessStep component
    - Booking confirmation
    - Booking details display
    - _Requirements: 6_

  - [ ]* 9.7 Write property tests for booking flow
    - **Property 5: Service selection flow**
    - **Property 6: Booking data persistence**
    - **Validates: Requirements 6.4, 6.7**

- [x] 10. Frontend: Main public page assembly
  - [x] 10.1 Create Public/Booking/Show.tsx page
    - Assemble all components
    - Implement glass morphism styles
    - Add animations
    - _Requirements: 1_

  - [ ]* 10.2 Write property test for glass morphism styling
    - **Property 9: Glass morphism styling consistency**
    - **Validates: Requirements 1.1**

  - [x] 10.3 Create FloatingBookingBar component
    - Fixed bottom bar
    - Book now and call buttons
    - Glass morphism styling
    - _Requirements: 1_

  - [x] 10.4 Add custom CSS for glass effects
    - Create public.css with glass-card, glass-icon, floating-dock classes
    - Add animation keyframes
    - _Requirements: 1_

- [ ] 11. Frontend: Portfolio management page
  - [ ] 11.1 Create Portfolio/Index.tsx page
    - List of portfolio items
    - Sortable grid with drag & drop
    - Bulk actions
    - _Requirements: 7_

  - [ ] 11.2 Create UploadZone component
    - Drag & drop file upload
    - Multiple file support
    - Preview before upload
    - _Requirements: 7.4_

  - [ ] 11.3 Create ImageCard component
    - Image preview
    - Edit and delete buttons
    - Visibility toggle
    - _Requirements: 7.7_

  - [ ] 11.4 Create ImageEditor component
    - Crop and rotate functionality
    - Save edited image
    - _Requirements: 7_

  - [ ] 11.5 Add portfolio routes to frontend
    - /app/portfolio
    - /app/portfolio/upload
    - _Requirements: 7_

- [ ] 12. Frontend: Public page settings
  - [ ] 12.1 Create Settings/PublicPage.tsx page
    - Form for all public page settings
    - Live preview panel
    - _Requirements: 8_

  - [ ] 12.2 Create ColorPicker component
    - Color selection for theme_color
    - _Requirements: 8.7_

  - [ ] 12.3 Create GradientPicker component
    - Two color pickers for gradient
    - Preview of gradient
    - _Requirements: 8.8_

  - [ ] 12.4 Create LivePreview component
    - Iframe with public page
    - Real-time updates on changes
    - _Requirements: 8.9_

  - [ ] 12.5 Create SocialInput component
    - Input fields for social links
    - Validation and formatting
    - _Requirements: 8.6_

- [-] 13. Integration and polish
  - [x] 13.1 Integrate with existing booking API
    - Ensure compatibility with slots endpoint
    - Ensure compatibility with book endpoint
    - _Requirements: 12_

  - [ ] 13.2 Add responsive design breakpoints
    - Test on 320px, 768px, 1024px, 1920px
    - Adjust font sizes and spacing
    - _Requirements: 10_

  - [ ] 13.3 Optimize images and performance
    - Implement lazy loading
    - Add caching headers
    - Optimize bundle size
    - _Requirements: 10_

  - [ ] 13.4 Add error handling and loading states
    - Loading spinners
    - Error messages
    - Retry logic
    - _Requirements: All_

- [ ] 14. Testing and quality assurance
  - [ ]* 14.1 Run all property-based tests
    - Verify all 10 properties pass
    - Fix any failing tests
    - _Requirements: All_

  - [ ]* 14.2 Run integration tests
    - Test complete booking flow
    - Test portfolio management
    - Test settings updates
    - _Requirements: All_

  - [ ]* 14.3 Run E2E tests
    - Test user journey from public page to booking
    - Test master journey from settings to preview
    - _Requirements: All_

  - [ ]* 14.4 Visual regression testing
    - Screenshot comparison
    - Test animations
    - Test hover states
    - _Requirements: 1, 10_

- [ ] 15. Final checkpoint and deployment
  - Ensure all tests pass, ask the user if questions arise.
  - Compile frontend assets
  - Deploy to staging
  - User acceptance testing
  - Deploy to production

## Notes

- Tasks marked with `*` are optional testing tasks that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Integration tests validate complete workflows
- E2E tests validate user journeys

## Dependencies

- **Intervention Image**: For image processing (resize, crop, optimize)
- **react-dropzone**: For drag & drop file upload
- **react-easy-crop**: For image cropping
- **@dnd-kit/core**: For drag & drop sorting
- **DOMPurify**: For XSS protection
- **date-fns**: For date formatting (already installed)

## Estimated Timeline

- Database & Backend: 2 weeks
- Frontend Components: 2 weeks
- Portfolio Management: 1 week
- Settings & Integration: 1 week
- Testing & Polish: 1 week (if optional tasks included)

**Total: 6-7 weeks**

