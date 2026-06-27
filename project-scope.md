## Problem

The problem is how to manage the tickets in an efficient manner. Mosh was receiving different tickets but 
he was not able to get them resolved timely,causing an overdue lists of tickets. So he wants a solution
to this problem,where he can help his agents in getting the tickets resolved bu=y providing them human 
friendly answers,timely and polished mails.



## Solution

Building a software (web app) which recieves tickets,categorize them into categories like general tickets or technical tickets,
or tickets related to subscription or course,etc. and then deciding whether their exists answer to it in the db from previous any tickets solution,
if not then assigning to the agent.



## Ticket Statuses

- **Open** — ticket has been received and is awaiting action
- **Resolved** — ticket has been addressed by an agent
- **Closed** — ticket is fully closed, no further action needed

## Ticket Categories

Each ticket belongs to exactly one of the following categories:

- **General Question** — general inquiries not tied to a specific product issue
- **Technical Question** — technical issues or bugs related to a product or service
- **Refund Request** — requests for refunds or billing disputes

## Roles

- **Admin** — deployed with the system (single admin). Can create and manage agents.
- **Agent** — created by the admin. Handles and resolves assigned tickets.

## Features

- Receive support emails and automatically create tickets
- Auto-generate human-friendly responses using a knowledge base
- Ticket list with filtering and sorting
- Ticket detail view
- AI-powered ticket classification
- AI-generated ticket summaries
- AI-suggested replies
- User management (admin only)
- Dashboard to view and manage all tickets