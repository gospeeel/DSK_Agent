FROM golang:1.26-alpine AS builder

WORKDIR /app

COPY backend/go.mod backend/go.sum ./
RUN go mod download

COPY backend/ .

RUN go build -o /user_server ./cmd/user_server
RUN go build -o /staff_server ./cmd/staff_server

FROM alpine:latest
WORKDIR /

COPY --from=builder /user_server /user_server
COPY --from=builder /staff_server /staff_server



EXPOSE 8080 8081
