# Swagger/OpenAPI Setup Guide

## What Was Added

### 1. Dependencies

Installed the following packages:

```bash
npm install --save @nestjs/swagger class-validator class-transformer
```

- **@nestjs/swagger**: Provides Swagger/OpenAPI integration for NestJS
- **class-validator**: Enables declarative validation using decorators
- **class-transformer**: Transforms plain objects to class instances

### 2. Data Transfer Objects (DTOs)

Created structured DTOs with validation decorators:

#### `dto/update-profile.dto.ts`

```typescript
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  statusMessage?: string;
}
```

#### `dto/user-profile-response.dto.ts`

Defines the structure of user profile responses with Swagger documentation.

#### `dto/upload-profile-picture-response.dto.ts`

Defines the structure of profile picture upload responses.

### 3. Controller Documentation

Enhanced `profile.controller.ts` with comprehensive Swagger decorators:

- **@ApiTags**: Groups endpoints under "Profile" category
- **@ApiOperation**: Describes each endpoint's purpose
- **@ApiParam**: Documents path parameters
- **@ApiQuery**: Documents query parameters
- **@ApiBody**: Documents request body schemas
- **@ApiResponse**: Documents possible response types and status codes
- **@ApiConsumes**: Specifies content types (e.g., multipart/form-data)

### 4. Swagger Configuration

Updated `main.ts` to initialize Swagger:

```typescript
const config = new DocumentBuilder()
  .setTitle('RetroChat API')
  .setDescription('API documentation for RetroChat')
  .setVersion('1.0')
  .addTag('Profile', 'User profile management endpoints')
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
```

## Accessing the Documentation

Once the server is running:

```bash
npm run start:dev
```

Visit: **http://localhost:3001/api/docs**

You'll see an interactive Swagger UI where you can:

- Browse all API endpoints
- View request/response schemas
- Test endpoints directly from the browser
- See validation rules and constraints
- Download the OpenAPI specification

## Validation Features

### Request Validation

All endpoints with DTOs automatically validate:

- **Type checking**: Ensures correct data types
- **String length**: Min/max length constraints
- **Required fields**: Enforces mandatory parameters
- **Whitelist**: Removes unknown properties
- **Transform**: Converts plain objects to DTO instances

### Example Validation Errors

If you send invalid data:

```json
{
  "displayName": "", // Too short (min: 1)
  "unknownField": "value" // Not allowed
}
```

You'll receive a 400 Bad Request with detailed error messages:

```json
{
  "statusCode": 400,
  "message": [
    "displayName must be longer than or equal to 1 characters",
    "property unknownField should not exist"
  ],
  "error": "Bad Request"
}
```

## Benefits

1. **Self-documenting API**: Swagger generates documentation from code
2. **Type safety**: DTOs ensure type consistency across the application
3. **Automatic validation**: Reduces boilerplate validation code
4. **Interactive testing**: Test endpoints without external tools
5. **Client generation**: Can generate API clients from OpenAPI spec
6. **Team collaboration**: Provides a single source of truth for API contracts

## Best Practices

1. **Always use DTOs**: Create DTOs for all request/response bodies
2. **Add descriptions**: Use Swagger decorators to document behavior
3. **Specify examples**: Include example values in @ApiProperty
4. **Document errors**: List all possible error responses
5. **Keep DTOs focused**: One DTO per specific use case
6. **Validate early**: Use validation pipes on controllers

## Future Enhancements

Consider adding:

- **Authentication documentation**: Document auth requirements with @ApiBearerAuth
- **Request examples**: Add more detailed examples for complex requests
- **Response examples**: Show sample responses for each endpoint
- **Tags organization**: Group related endpoints with more specific tags
- **Versioning**: Document API versions if needed
