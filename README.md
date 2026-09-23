Hospital Support Request System

Departments raise:

* Equipment issue
* Maintenance
* IT issue
* Facility request

---

# 3. `Hospital Support Request System`

A hospital has different departments that raise support requests for equipment, maintenance, IT, and facility-related issues.

Example:

> Hospital Department → raises equipment/maintenance/IT/facility request →
> Support Desk → assigns technician/staff → technician works on it →
> resolves → department confirms → request closed.

### Main actors

| Role             | Responsibilities                                     |
| ---------------- | ---------------------------------------------------- |
| Department Staff | Create and view requests raised by their department  |
| Support Engineer | View assigned requests, work on them, update status  |
| Team Lead        | Assign/reassign requests, monitor support team       |
| Admin            | Manage users, departments, categories, configuration |

### Core entities

```text
User

ServiceRequest

Category

Comment

Attachment

AuditLog
```

### Request categories

```text
EQUIPMENT_ISSUE
MAINTENANCE
IT_ISSUE
FACILITY_REQUEST
```

### Request lifecycle

```text
NEW
  ↓
ASSIGNED
  ↓
IN_PROGRESS
  ↓
RESOLVED
  ↓
CLOSED
```

with possible:

```text
IN_PROGRESS → ON_HOLD
ON_HOLD → IN_PROGRESS
```

### Example

```text
Nursing Department
        ↓
Raises "Equipment Issue" request
        ↓
Hospital Support Desk
        ↓
Assigns to Equipment Technician
        ↓
Technician inspects and repairs equipment
        ↓
RESOLVED
        ↓
Nursing Department confirms
        ↓
CLOSED
```

This is essentially the same **service-request workflow** as Apps 1 and 2, but the domain changes from **IT → College → Hospital**.
