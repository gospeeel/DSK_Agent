package swagger

import "encoding/json"

type openAPIDocument map[string]any
type openAPIObject map[string]any

func init() {
	UserSpec = updateUserSpec(UserSpec)
	StaffSpec = updateStaffSpec(StaffSpec)
}

func updateUserSpec(raw []byte) []byte {
	doc := decodeSpec(raw)
	installSharedSchemas(doc)
	paths := object(doc, "paths")

	ai := operation(paths, "/api/ai/chat", "post")
	ai["security"] = bearerSecurity()
	ai["requestBody"] = requestBody("AIChatRequest")
	ai["responses"] = responses(map[string]string{
		"200": "AIChatResponse", "400": "", "401": "", "403": "", "500": "", "503": "", "504": "",
	})

	paths["/api/notifications"] = openAPIObject{
		"get": securedListOperation("Notifications", "Получить уведомления пользователя", "Notification"),
	}
	paths["/api/notifications/read-all"] = openAPIObject{
		"put": openAPIObject{
			"tags": []string{"Notifications"}, "summary": "Отметить все уведомления как прочитанные", "security": bearerSecurity(),
			"responses": responses(map[string]string{"200": ""}),
		},
	}
	paths["/api/notifications/{id}/read"] = openAPIObject{
		"put": openAPIObject{
			"tags": []string{"Notifications"}, "summary": "Отметить уведомление как прочитанное", "security": bearerSecurity(),
			"parameters": []any{idParameter("id")},
			"responses":  responses(map[string]string{"200": "", "404": ""}),
		},
	}

	paths["/api/progress/{id}"] = openAPIObject{
		"get": securedReadOperation("Catalog", "Получить этап строительства", "ConstructionProgress"),
	}
	// This catalog route is public in user-server.
	delete(operation(paths, "/api/progress/{id}", "get"), "security")
	return encodeSpec(doc)
}


func updateStaffSpec(raw []byte) []byte {
	doc := decodeSpec(raw)
	installSharedSchemas(doc)
	paths := object(doc, "paths")

	paths["/api/auth/logout"] = openAPIObject{
		"post": openAPIObject{"tags": []string{"Auth"}, "summary": "Выход из системы", "responses": responses(map[string]string{"200": ""})},
	}
	paths["/api/users/{id}"] = openAPIObject{
		"get": securedReadOperation("Users", "Получить пользователя по ID", "User"),
	}

	ai := operation(paths, "/api/ai/chat", "post")
	ai["security"] = bearerSecurity()
	ai["requestBody"] = requestBody("AIChatRequest")
	ai["responses"] = responses(map[string]string{
		"200": "AIChatResponse", "400": "", "401": "", "403": "", "500": "", "503": "", "504": "",
	})

	installStaffConstructionRoutes(paths)
	return encodeSpec(doc)
}

func installStaffConstructionRoutes(paths openAPIObject) {
	paths["/api/complexes"] = openAPIObject{
		"get":  securedListOperation("Construction", "Получить жилые комплексы", "ResidentialComplex"),
		"post": securedWriteOperation("Construction", "Создать жилой комплекс", "ResidentialComplexWrite", "ResidentialComplex", "201"),
	}
	paths["/api/complexes/{id}"] = crudItemOperations("жилой комплекс", "ResidentialComplexWrite", "ResidentialComplex")
	paths["/api/complexes/{complexId}/buildings"] = openAPIObject{
		"get": securedListOperationWithParameter("Construction", "Получить корпуса жилого комплекса", "Building", "complexId"),
	}

	paths["/api/buildings"] = openAPIObject{
		"post": securedWriteOperation("Construction", "Создать корпус", "BuildingWrite", "Building", "201"),
	}
	paths["/api/buildings/{id}"] = crudItemOperations("корпус", "BuildingWrite", "Building")
	paths["/api/buildings/{buildingId}/apartments"] = openAPIObject{
		"get": securedListOperationWithParameter("Construction", "Получить квартиры корпуса", "Apartment", "buildingId"),
	}
	paths["/api/buildings/{buildingId}/progress"] = openAPIObject{
		"get": securedListOperationWithParameter("Construction", "Получить этапы строительства корпуса", "ConstructionProgress", "buildingId"),
	}

	paths["/api/apartments"] = openAPIObject{
		"post": securedWriteOperation("Construction", "Создать квартиру", "ApartmentWrite", "Apartment", "201"),
	}
	paths["/api/apartments/{id}"] = crudItemOperations("квартиру", "ApartmentWrite", "Apartment")

	paths["/api/progress"] = openAPIObject{
		"post": securedWriteOperation("Construction", "Создать этап строительства", "ConstructionProgressWrite", "ConstructionProgress", "201"),
	}
	paths["/api/progress/{id}"] = crudItemOperations("этап строительства", "ConstructionProgressWrite", "ConstructionProgress")
}

func installSharedSchemas(doc openAPIDocument) {
	components := object(doc, "components")
	schemas := object(components, "schemas")
	for name, schema := range sharedSchemas() {
		schemas[name] = schema
	}
}

func sharedSchemas() openAPIObject {
	integer := func(nullable bool) openAPIObject {
		result := openAPIObject{"type": "integer"}
		if nullable {
			result["nullable"] = true
		}
		return result
	}
	date := func() openAPIObject { return openAPIObject{"type": "string", "format": "date-time", "nullable": true} }
	enum := func(values ...string) openAPIObject { return openAPIObject{"type": "string", "enum": values} }

	return openAPIObject{
		"AIChatRequest": schema([]string{"message", "session_id"}, openAPIObject{
			"message": openAPIObject{"type": "string"}, "session_id": integer(false), "deal_id": integer(true),
		}),
		"AIChatResponse": schema([]string{"message", "agent", "intent"}, openAPIObject{
			"message": openAPIObject{"type": "string"}, "agent": openAPIObject{"type": "string"}, "intent": openAPIObject{"type": "string"},
		}),
		"CreateDealRequest": schema([]string{"id_user", "id_apartment", "base_price", "percent_discount"}, openAPIObject{
			"id_user": integer(false), "id_apartment": integer(false), "id_chat_session": integer(true),
			"base_price": openAPIObject{"type": "number"}, "percent_discount": openAPIObject{"type": "number"},
		}),
		"User": schema([]string{"id", "name", "email", "role"}, openAPIObject{
			"id": integer(false), "name": openAPIObject{"type": "string"}, "email": openAPIObject{"type": "string", "format": "email"},
			"role": enum("user", "manager", "supervisor"), "budget_max": openAPIObject{"type": "integer", "format": "int64", "nullable": true},
			"preferences": openAPIObject{"type": "object", "additionalProperties": true},
		}),
		"ResidentialComplex": schema([]string{"id", "name", "address", "description"}, openAPIObject{
			"id": integer(false), "name": openAPIObject{"type": "string"}, "address": openAPIObject{"type": "string"}, "description": openAPIObject{"type": "string"},
		}),
		"ResidentialComplexWrite": schema([]string{"name", "address"}, openAPIObject{
			"name": openAPIObject{"type": "string"}, "address": openAPIObject{"type": "string"}, "description": openAPIObject{"type": "string"},
		}),
		"Building": schema([]string{"id", "residential_complex_id", "address", "district", "latitude", "longitude", "floors_count", "status", "type_wall_material"}, openAPIObject{
			"id": integer(false), "residential_complex_id": integer(false), "address": openAPIObject{"type": "string"}, "district": openAPIObject{"type": "string"},
			"latitude": openAPIObject{"type": "number", "format": "double"}, "longitude": openAPIObject{"type": "number", "format": "double"}, "floors_count": integer(false),
			"planned_date": date(), "actual_date": date(), "status": enum("design", "construction", "completed", "suspended"),
			"type_wall_material": enum("panel", "monolith", "brick", "block"),
		}),
		"BuildingWrite": schema([]string{"residential_complex_id", "address", "status", "type_wall_material"}, openAPIObject{
			"residential_complex_id": integer(false), "address": openAPIObject{"type": "string"}, "district": openAPIObject{"type": "string"},
			"latitude": openAPIObject{"type": "number", "format": "double"}, "longitude": openAPIObject{"type": "number", "format": "double"}, "floors_count": integer(false),
			"planned_date": date(), "actual_date": date(), "status": enum("design", "construction", "completed", "suspended"),
			"type_wall_material": enum("panel", "monolith", "brick", "block"),
		}),
		"Apartment": schema([]string{"id", "building_id", "number", "rooms", "floor", "area", "price", "type_finishing", "status"}, openAPIObject{
			"id": integer(false), "building_id": integer(false), "number": openAPIObject{"type": "string"}, "rooms": integer(false), "floor": integer(false),
			"area": openAPIObject{"type": "number"}, "price": openAPIObject{"type": "number"}, "type_finishing": enum("rough", "white_box", "turnkey"),
			"status": enum("free", "booked", "sold"),
		}),
		"ApartmentWrite": schema([]string{"building_id", "number", "rooms", "area", "price", "status"}, openAPIObject{
			"building_id": integer(false), "number": openAPIObject{"type": "string"}, "rooms": integer(false), "floor": integer(false),
			"area": openAPIObject{"type": "number"}, "price": openAPIObject{"type": "number"}, "type_finishing": enum("rough", "white_box", "turnkey"),
			"status": enum("free", "booked", "sold"),
		}),
		"ConstructionProgress": schema([]string{"id", "building_id", "stage_name", "status", "delay_reason"}, openAPIObject{
			"id": integer(false), "building_id": integer(false), "stage_name": enum("excavation", "foundation", "frame", "roofing", "finishing"),
			"planned_start_date": date(), "actual_start_date": date(), "planned_end_date": date(), "actual_end_date": date(),
			"status": enum("not_started", "in_progress", "completed", "delayed"), "completion_percentage": integer(true),
			"delay_reason": openAPIObject{"type": "string"}, "risk_level": openAPIObject{"type": "string", "nullable": true}, "delay_days": integer(true),
		}),
		"ConstructionProgressWrite": schema([]string{"building_id", "stage_name", "status"}, openAPIObject{
			"building_id": integer(false), "stage_name": enum("excavation", "foundation", "frame", "roofing", "finishing"),
			"planned_start_date": date(), "actual_start_date": date(), "planned_end_date": date(), "actual_end_date": date(),
			"status": enum("not_started", "in_progress", "completed", "delayed"), "completion_percentage": integer(true),
			"delay_reason": openAPIObject{"type": "string"}, "risk_level": openAPIObject{"type": "string", "nullable": true}, "delay_days": integer(true),
		}),
		"Notification": schema([]string{"id", "user_id", "type", "title", "message", "is_read", "created_at"}, openAPIObject{
			"id": integer(false), "user_id": integer(false), "deal_id": integer(true),
			"type": enum("construction_delay", "construction_risk", "deal_update", "general"),
			"title": openAPIObject{"type": "string"}, "message": openAPIObject{"type": "string"},
			"is_read": openAPIObject{"type": "boolean"}, "created_at": date(), "read_at": date(),
		}),
	}
}


func schema(required []string, properties openAPIObject) openAPIObject {
	result := openAPIObject{"type": "object", "properties": properties}
	if len(required) > 0 {
		result["required"] = required
	}
	return result
}

func crudItemOperations(noun, requestSchema, responseSchema string) openAPIObject {
	update := securedWriteOperation("Construction", "Обновить "+noun, requestSchema, responseSchema, "200")
	update["parameters"] = []any{idParameter("id")}
	return openAPIObject{
		"get":    securedReadOperation("Construction", "Получить "+noun, responseSchema),
		"put":    update,
		"delete": securedDeleteOperation("Construction", "Удалить "+noun),
	}
}

func securedReadOperation(tag, summary, responseSchema string) openAPIObject {
	return openAPIObject{
		"tags": []string{tag}, "summary": summary, "security": bearerSecurity(), "parameters": []any{idParameter("id")},
		"responses": responses(map[string]string{"200": responseSchema, "400": "", "401": "", "403": "", "404": ""}),
	}
}

func securedListOperation(tag, summary, itemSchema string) openAPIObject {
	return openAPIObject{
		"tags": []string{tag}, "summary": summary, "security": bearerSecurity(),
		"responses": responses(map[string]string{"200": "[]" + itemSchema, "401": "", "403": "", "500": ""}),
	}
}

func securedListOperationWithParameter(tag, summary, itemSchema, parameter string) openAPIObject {
	op := securedListOperation(tag, summary, itemSchema)
	op["parameters"] = []any{idParameter(parameter)}
	return op
}

func securedWriteOperation(tag, summary, requestSchema, responseSchema, successCode string) openAPIObject {
	return openAPIObject{
		"tags": []string{tag}, "summary": summary, "security": bearerSecurity(), "requestBody": requestBody(requestSchema),
		"responses": responses(map[string]string{successCode: responseSchema, "400": "", "401": "", "403": "", "500": ""}),
	}
}

func securedDeleteOperation(tag, summary string) openAPIObject {
	return openAPIObject{
		"tags": []string{tag}, "summary": summary, "security": bearerSecurity(), "parameters": []any{idParameter("id")},
		"responses": responses(map[string]string{"204": "", "400": "", "401": "", "403": "", "500": ""}),
	}
}

func requestBody(schemaName string) openAPIObject {
	return openAPIObject{"required": true, "content": openAPIObject{"application/json": openAPIObject{"schema": ref(schemaName)}}}
}

func responses(items map[string]string) openAPIObject {
	result := openAPIObject{}
	for code, schemaName := range items {
		response := openAPIObject{"description": "HTTP " + code}
		if schemaName != "" {
			var responseSchema openAPIObject
			if len(schemaName) > 2 && schemaName[:2] == "[]" {
				responseSchema = openAPIObject{"type": "array", "items": ref(schemaName[2:])}
			} else {
				responseSchema = ref(schemaName)
			}
			response["content"] = openAPIObject{"application/json": openAPIObject{"schema": responseSchema}}
		}
		result[code] = response
	}
	return result
}

func idParameter(name string) openAPIObject {
	return openAPIObject{"name": name, "in": "path", "required": true, "schema": openAPIObject{"type": "integer"}}
}

func bearerSecurity() []any         { return []any{openAPIObject{"BearerAuth": []any{}}} }
func ref(name string) openAPIObject { return openAPIObject{"$ref": "#/components/schemas/" + name} }

func operation(paths openAPIObject, path, method string) openAPIObject {
	pathObject, ok := paths[path].(map[string]any)
	if !ok {
		pathObject = openAPIObject{}
		paths[path] = pathObject
	}
	op, ok := pathObject[method].(map[string]any)
	if !ok {
		op = openAPIObject{}
		pathObject[method] = op
	}
	return op
}

func object(parent map[string]any, key string) openAPIObject {
	if value, ok := parent[key].(map[string]any); ok {
		return value
	}
	value := openAPIObject{}
	parent[key] = value
	return value
}

func decodeSpec(raw []byte) openAPIDocument {
	var doc openAPIDocument
	if err := json.Unmarshal(raw, &doc); err != nil {
		panic("invalid embedded OpenAPI document: " + err.Error())
	}
	return doc
}

func encodeSpec(doc openAPIDocument) []byte {
	raw, err := json.MarshalIndent(doc, "", "  ")
	if err != nil {
		panic("cannot encode OpenAPI document: " + err.Error())
	}
	return raw
}
