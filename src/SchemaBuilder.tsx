import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Input, Button, Row, Col, Select, Space, Typography } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";

interface Field {
  name: string;
  type: "String" | "Number" | "Nested" | "Array" | string;
  arrayItemType?: "String" | "Number" | "Nested" | string;
  fields?: Field[];
}

interface FormValues {
  fields: Field[];
}

const { Text } = Typography;
const { Option } = Select;

const FieldComponent: React.FC<{
  field: Field;
  fieldIndex: number;
  fields: Field[];
  onUpdateField: (updatedFields: Field[]) => void;
  onRemoveField: (index: number) => void;
  depth?: number;
}> = ({
  field,
  fieldIndex,
  fields,
  onUpdateField,
  onRemoveField,
  depth = 0,
}) => {
  const updateCurrentField = (updates: Partial<Field>) => {
    const updatedFields = [...fields];
    updatedFields[fieldIndex] = { ...updatedFields[fieldIndex], ...updates };
    onUpdateField(updatedFields);
  };

  const handleAddNestedField = () => {
    const newField: Field = { name: "", type: "String" };
    const updatedFields = [...fields];

    if (!updatedFields[fieldIndex].fields) {
      updatedFields[fieldIndex].fields = [];
    }

    updatedFields[fieldIndex].fields!.push(newField);
    onUpdateField(updatedFields);
  };

  const handleAddArrayItemField = () => {
    const newField: Field = { name: "", type: "String" };
    const updatedFields = [...fields];

    if (!updatedFields[fieldIndex].fields) {
      updatedFields[fieldIndex].fields = [];
    }

    updatedFields[fieldIndex].fields!.push(newField);
    onUpdateField(updatedFields);
  };

  const handleUpdateNestedFields = (updatedNestedFields: Field[]) => {
    updateCurrentField({ fields: updatedNestedFields });
  };

  const handleRemoveNestedField = (nestedIndex: number) => {
    const updatedFields = [...fields];
    updatedFields[fieldIndex].fields!.splice(nestedIndex, 1);
    onUpdateField(updatedFields);
  };

  const indentStyle = {
    marginLeft: `${depth * 20}px`,
    marginBottom: "10px",
    border: depth > 0 ? "1px solid #e8e8e8" : "none",
    borderRadius: depth > 0 ? "4px" : "0",
    padding: depth > 0 ? "10px" : "0",
    backgroundColor: depth > 0 ? "#fafafa" : "transparent",
  };

  return (
    <div style={indentStyle}>
      <Row gutter={16} style={{ marginBottom: "10px" }}>
        <Col span={8}>
          <Input
            value={field.name}
            placeholder={`Field Name ${depth > 0 ? "(Nested)" : ""}`}
            onChange={(e) => updateCurrentField({ name: e.target.value })}
          />
        </Col>

        <Col span={6}>
          <Select
            value={field.type}
            onChange={(value) => {
              const updates: Partial<Field> = { type: value };
              if (value !== "Nested" && value !== "Array") {
                updates.fields = undefined;
                updates.arrayItemType = undefined;
              } else if (value === "Array" && !field.arrayItemType) {
                updates.arrayItemType = "String";
                updates.fields = undefined;
              } else if (value === "Nested" && !field.fields) {
                updates.fields = [];
                updates.arrayItemType = undefined;
              }
              updateCurrentField(updates);
            }}
          >
            <Option value="String">String</Option>
            <Option value="Number">Number</Option>
            <Option value="Array">Array</Option>
            <Option value="Nested">Nested</Option>
          </Select>
        </Col>

        {field.type === "Array" && (
          <Col span={6}>
            <Select
              value={field.arrayItemType || "String"}
              onChange={(value) => {
                const updates: Partial<Field> = { arrayItemType: value };
                if (value !== "Nested") {
                  updates.fields = undefined;
                } else if (!field.fields) {
                  updates.fields = [];
                }
                updateCurrentField(updates);
              }}
              placeholder="Array Item Type"
            >
              <Option value="String">String[]</Option>
              <Option value="Number">Number[]</Option>
              <Option value="Nested">Object[]</Option>
            </Select>
          </Col>
        )}

        <Col span={field.type === "Array" ? 6 : 8}>
          <Space>
            <Button
              icon={<MinusCircleOutlined />}
              onClick={() => onRemoveField(fieldIndex)}
              danger
            />
            {field.type === "Nested" && (
              <Button
                icon={<PlusOutlined />}
                onClick={handleAddNestedField}
                size="small"
              >
                Add Nested
              </Button>
            )}
            {field.type === "Array" && field.arrayItemType === "Nested" && (
              <Button
                icon={<PlusOutlined />}
                onClick={handleAddArrayItemField}
                size="small"
              >
                Add Item Field
              </Button>
            )}
          </Space>
        </Col>
      </Row>

      {field.type === "Nested" && field.fields && field.fields.length > 0 && (
        <div style={{ marginTop: "10px" }}>
          <Text style={{ fontSize: "12px", color: "#666" }}>
            Nested Object Fields:
          </Text>
          {field.fields.map((nestedField, nestedIndex) => (
            <FieldComponent
              key={nestedIndex}
              field={nestedField}
              fieldIndex={nestedIndex}
              fields={field.fields!}
              onUpdateField={handleUpdateNestedFields}
              onRemoveField={handleRemoveNestedField}
              depth={depth + 1}
            />
          ))}
        </div>
      )}

      {field.type === "Array" &&
        field.arrayItemType === "Nested" &&
        field.fields &&
        field.fields.length > 0 && (
          <div style={{ marginTop: "10px" }}>
            <Text style={{ fontSize: "12px", color: "#666" }}>
              Array Item Structure:
            </Text>
            {field.fields.map((nestedField, nestedIndex) => (
              <FieldComponent
                key={nestedIndex}
                field={nestedField}
                fieldIndex={nestedIndex}
                fields={field.fields!}
                onUpdateField={handleUpdateNestedFields}
                onRemoveField={handleRemoveNestedField}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
    </div>
  );
};

const JsonSchemaBuilder: React.FC = () => {
  const { control, setValue, getValues, watch } = useForm<FormValues>({
    defaultValues: {
      fields: [],
    },
  });

  const [jsonSchema, setJsonSchema] = useState<string>("{}");

  const { fields, append, remove } = useFieldArray({
    control,
    name: "fields",
  });

  const buildSchema = (fields: Field[]): any => {
    const schema: any = {};

    fields.forEach((field) => {
      if (field.name) {
        if (field.type === "Array") {
          if (
            field.arrayItemType === "Nested" &&
            field.fields &&
            field.fields.length > 0
          ) {
            schema[field.name] = [buildSchema(field.fields)];
          } else {
            const itemType = field.arrayItemType?.toLowerCase() || "string";
            schema[field.name] = [itemType];
          }
        } else if (
          field.type === "Nested" &&
          field.fields &&
          field.fields.length > 0
        ) {
          schema[field.name] = buildSchema(field.fields);
        } else if (field.type !== "Nested") {
          schema[field.name] = field.type.toLowerCase();
        }
      }
    });

    return schema;
  };

  const updateJsonSchema = () => {
    const currentFields = getValues("fields");
    const schemaObject = buildSchema(currentFields);
    setJsonSchema(JSON.stringify(schemaObject, null, 2));
  };

  useEffect(() => {
    const subscription = watch(() => {
      updateJsonSchema();
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  const handleAddField = () => {
    append({ name: "", type: "String" });
  };

  const handleRemoveField = (index: number) => {
    remove(index);
  };

  const handleUpdateFields = (updatedFields: Field[]) => {
    setValue("fields", updatedFields, { shouldValidate: true });
  };

  return (
    <div style={{ display: "flex", gap: 32, padding: 24, minHeight: "100vh" }}>
      <div style={{ flex: "1", maxWidth: "600px" }}>
        <Row gutter={16}>
          <Col span={24}>
            <Text strong style={{ fontSize: "18px" }}>
              JSON Schema Builder
            </Text>
            <div style={{ marginBottom: "20px" }} />
          </Col>
        </Row>

        <div>
          {fields.map((fieldItem, index) => (
            <FieldComponent
              key={index}
              field={fieldItem}
              fieldIndex={index}
              fields={fields}
              onUpdateField={handleUpdateFields}
              onRemoveField={handleRemoveField}
              depth={0}
            />
          ))}
        </div>

        <Button
          type="dashed"
          onClick={handleAddField}
          icon={<PlusOutlined />}
          style={{ width: "100%", marginTop: "10px" }}
        >
          Add Field
        </Button>
      </div>

      <div style={{ flex: 1, minWidth: "300px" }}>
        <Text strong style={{ fontSize: "18px" }}>
          JSON Preview
        </Text>
        <pre
          style={{
            backgroundColor: "#f5f5f5",
            padding: "16px",
            borderRadius: "6px",
            marginTop: "20px",
            overflow: "auto",
            maxHeight: "80vh",
          }}
        >
          {jsonSchema}
        </pre>
      </div>
    </div>
  );
};

export default JsonSchemaBuilder;