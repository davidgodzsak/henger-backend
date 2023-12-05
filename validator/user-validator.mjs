import Ajv from "ajv";
import addFormats from "ajv-formats";

const ajv = new Ajv({ allErrors: true });
addFormats(ajv, ["email", "date"]);

const userSchema = {
    type: "object",
    properties: {
        name: { type: "string", minLength: 3 },
        pin: { type: "string", minLength: 4, maxLength: 4 },
        email: { type: "string", format: "email" },
        monthlyFee: { type: "number" },
        active: { type: "boolean", default: true },
        startedAt: { type: "string", format: "date" },
        days: { type: "array", uniqueItems: true, items: { type: "string", enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] } },
        groups: { type: "array", uniqueItems: true, items: { type: "string", enum: ['workshops', 'members', 'bills', 'settings'] } },
        comments: { type: "array", items: { type: "string" } }
    },
    required: ["name", "pin", "email", "monthlyFee", "days", "startedAt"]
}


const validate = ajv.compile(userSchema)

export default validate;