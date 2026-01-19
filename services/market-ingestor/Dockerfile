# Build stage
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Install dependencies
RUN apk add --no-cache gcc musl-dev

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build binary
RUN CGO_ENABLED=0 GOOS=linux go build -o market-ingestor .

# Runtime stage
FROM alpine:3.19

WORKDIR /app

# Install CA certificates for HTTPS requests
RUN apk --no-cache add ca-certificates tzdata

# Copy binary from builder
COPY --from=builder /app/market-ingestor .

# Expose port
EXPOSE 8080

# Run the binary
CMD ["./market-ingestor"]
