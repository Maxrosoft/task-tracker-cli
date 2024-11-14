#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getCurrentDate() {
    const d = new Date();
    return d.toISOString();
}

function generateId() {
    return Math.floor(Math.random() * 10 ** 16) + "";
}

class Task {
    constructor(description, status = "todo") {
        this.id = generateId();
        this.description = description;
        this.status = status;
        this.createdAt = getCurrentDate();
        this.updatedAt = this.createdAt;
    }
}

class TaskManager {
    constructor() {
        this.tasks = [];
        this.taskFile = path.join(__dirname, "tasks.json");
    }

    _load() {
        try {
            const data = fs.readFileSync(this.taskFile, "utf-8");
            if (data) {
                try {
                    this.tasks = JSON.parse(data);
                } catch (err) {
                    console.log("Error parsing JSON from task file:", err);
                    this.tasks = [];
                }
            }
        } catch (err) {
            if (err.code === "ENOENT") {
                this.tasks = [];
            } else {
                console.log("Error loading task list", err);
            }
        }
    }

    _save() {
        const tasksJSON = JSON.stringify(this.tasks, null, 2);
        try {
            fs.writeFileSync(this.taskFile, tasksJSON);
        } catch (err) {
            console.log("Error saving task list", err);
        }
    }

    add(taskDescription) {
        this._load();
        const taskToAdd = new Task(taskDescription);
        this.tasks.push(taskToAdd);
        this._save();
    }

    update(id, data, field) {
        this._load();
        this.tasks.map((task) => {
            if (task.id === id) {
                task[field] = data;
                task.updatedAt = getCurrentDate();
            }
        });
        this._save();
    }

    delete(id) {
        this._load();
        this.tasks = this.tasks.filter((task) => task.id !== id);
        this._save();
    }

    list(status) {
        this._load();

        if (!status) {
            console.log(this.tasks);
        } else {
            console.log(this.tasks.filter((task) => task.status === status));
        }

        this._save();
    }
}

const taskManager = new TaskManager();

const args = process.argv.slice(2);

if (args.length === 0) {
    console.log("Please provide a command.");
    process.exit(1);
}

const command = args[0];
let id;

switch (command) {
    case "add":
        if (args.length < 2) {
            console.log("Please provide a description for the task.");
            process.exit(1);
        }
        const taskDescription = args.slice(1).join(" ");
        taskManager.add(taskDescription);
        break;

    case "update":
    case "mark-in-progress":
    case "mark-done":
        if (args.length < 2) {
            console.log("Please provide id.");
            process.exit(1);
        }

        id = args[1];
        let data, field;
        switch (command) {
            case "update":
                data = args.slice(2).join(" ");
                field = "description";
                break;
            case "mark-in-progress":
                data = "in-progress";
                field = "status";
                break;
            case "mark-done":
                data = "done";
                field = "status";
                break;
        }

        taskManager.update(id, data, field);
        break;

    case "delete":
        if (args.length < 2) {
            console.log("Please provide id.");
            process.exit(1);
        }

        id = args[1];
        taskManager.delete(id);
        break;

    case "list":
        const status = args[1];

        taskManager.list(status);
        break;

    default:
        console.log("Unknown command:", command);
        break;
}
