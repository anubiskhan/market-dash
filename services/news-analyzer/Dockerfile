# Build stage
FROM python:3.12-slim AS builder

WORKDIR /app

# Install build dependencies
RUN pip install --no-cache-dir hatch

# Copy project files
COPY pyproject.toml .
COPY src/ src/

# Build wheel
RUN hatch build -t wheel

# Runtime stage
FROM python:3.12-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Copy wheel from builder
COPY --from=builder /app/dist/*.whl .

# Install the package
RUN pip install --no-cache-dir *.whl && rm *.whl

# Expose port
EXPOSE 8081

# Run the service
CMD ["python", "-m", "uvicorn", "news_analyzer.main:app", "--host", "0.0.0.0", "--port", "8081"]
