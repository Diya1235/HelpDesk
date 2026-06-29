import { db } from "../src/db";
import { SenderType } from "../src/generated/prisma";

const AGENT_ID = "V2vMzhQCvlR4a1M1NbJDyiSWmqPtwaCS"; // Sara Jones
const CUSTOMER_ID = "4Y5LgkykW2oH7eYMBNzCS5VRcp7Z3B9H"; // Admin acting as customer
const TICKET_ID = 102;

const REPLIES: { senderType: SenderType; body: string }[] = [
  {
    senderType: SenderType.Customer,
    body: `Hi, I wanted to follow up on my earlier question about merging duplicate contacts.
I have been going through my contact list and found well over 200 duplicate entries.
Most of them were created when I imported data from our old CRM system last quarter.
The duplicates usually differ by small things like an extra space or a slightly different email format.
Manually merging them one by one would take me days, which is not realistic for my team.
Is there a bulk merge tool built into the platform that I might have missed?
I have already looked through the Settings and Contacts sections but could not find anything obvious.
If the feature does not exist yet, do you have a workaround I could use in the meantime?
Even a CSV-based approach would be acceptable if it gets the job done.
Looking forward to your response — this is blocking some reporting work we need to finish.`,
  },
  {
    senderType: SenderType.Agent,
    body: `Hi Tom, thank you for reaching out and for the detailed description of your situation.
I completely understand how frustrating it can be to deal with hundreds of duplicates after a CRM migration.
The good news is that we do have a Duplicate Detection tool available under Contacts → Tools → Find Duplicates.
It automatically groups contacts that share the same email address or a very similar name.
From there you can review each group and select "Merge All" to consolidate them in one click.
For bulk scenarios like yours, I would recommend running the detection scan first to see how many groups it identifies.
You can then sort the groups by confidence score and bulk-merge the high-confidence ones first.
The tool also lets you choose which record becomes the "master" so you do not lose any important field data.
Please give it a try and let me know how many duplicates it finds — I am happy to walk you through the next steps.
If you run into any issues accessing the tool, please let me know your plan tier and I will check your permissions.`,
  },
  {
    senderType: SenderType.Customer,
    body: `Thanks Sara, I found the Duplicate Detection tool and ran the scan just now.
It found 187 groups which is actually more than I expected — impressive detection!
However I am running into a problem when I try to merge a group with more than 5 contacts in it.
The merge button stays greyed out and hovering over it shows "Maximum 5 contacts per merge operation".
About 40 of my groups have between 6 and 15 contacts in each, so this is a significant blocker.
Is there a way to increase that limit, or do I need to split those large groups manually first?
Also, I noticed that for some groups the tool picked the wrong record as the master contact.
For example it chose an older record with fewer fields filled in over a more complete newer one.
Can I change the master record selection before confirming the merge?
Please advise on both of these points before I proceed further.`,
  },
  {
    senderType: SenderType.Agent,
    body: `Hi Tom, great to hear the scan is working well and found all those groups for you.
You are right that there is currently a 5-contact limit per merge operation — thank you for flagging this.
For groups larger than 5, the workaround is to merge them in batches: select 5, merge, then merge again with the next set.
I know that is not ideal, but I have already escalated your feedback to our product team as a limitation to address.
Regarding the master record selection — yes, you absolutely can change it before confirming.
In the merge preview dialog, click the star icon next to any contact to promote it to master.
The star will move and all field data will be pulled from that record as the primary source.
Fields that only exist on secondary records are still preserved in the merge, so no data is lost.
One tip: sort by "Last Updated" in the preview so the most recently edited record appears at the top.
Let me know if you need a quick screen share to walk through the merge preview dialog together.`,
  },
  {
    senderType: SenderType.Customer,
    body: `Thanks for the tip about the star icon — I can see it now, that works perfectly.
I have been working through the groups in batches of 5 as you suggested.
The process is going smoothly for most groups but I hit an issue with email field conflicts.
When two contacts have different email addresses, the merge dialog asks me to pick one to keep.
In several cases both emails are valid and I actually need to retain both on the merged contact.
Is there a way to keep multiple email addresses on a single contact after merging?
I also noticed that custom field data from secondary records is not always carried over.
Specifically the "Account Manager" custom field seems to get dropped during the merge.
I have checked this on three different merges and it happens every time with that field.
Can you confirm whether this is a known bug or if I am doing something wrong?`,
  },
  {
    senderType: SenderType.Agent,
    body: `Hi Tom, both of these are really useful findings, thank you for documenting them so clearly.
On the multiple email addresses question — yes, our contacts support up to 5 email addresses per record.
In the merge dialog, instead of selecting just one email, you can tick the checkbox next to each one you want to keep.
All ticked emails will be saved to the merged contact, with the first one becoming the primary address.
If you do not see the checkboxes, make sure you are on app version 4.2 or later — that feature was added recently.
Regarding the "Account Manager" custom field being dropped — this is indeed a known bug we are tracking.
It affects custom fields of type "User Lookup" specifically, and the fix is scheduled for our next release (v4.3).
As a temporary workaround, after each merge you can manually re-enter the Account Manager value on the merged record.
I have also added your account to the bug notification list so you will be emailed when the fix goes live.
I am sorry for the inconvenience and appreciate your patience while we resolve this.`,
  },
  {
    senderType: SenderType.Customer,
    body: `Excellent, the multiple email checkbox is working great — I can see it now, thank you.
I have now merged about 120 of the 187 groups and things are going well overall.
However I just encountered a merge that I accidentally confirmed before reviewing properly.
I merged the wrong records together and now some field data from the correct master is gone.
Is there an undo function or a way to restore the pre-merge state of those contacts?
I am worried I may have lost some important notes and activity history for a key client.
The merge happened about 10 minutes ago so hopefully it is recoverable if there is a backup.
Also, on a separate note, the merge progress is not saving if I close the browser tab.
Every time I come back I have to start the detection scan again from scratch which is slow.
Is there a way to save my progress so I can pick up where I left off across sessions?`,
  },
  {
    senderType: SenderType.Agent,
    body: `Hi Tom, I completely understand the urgency here — let me address the accidental merge first.
We do maintain a 30-day contact history log that captures the state of records before any merge.
Go to Contacts → select the merged contact → click "History" in the right-side panel.
You will see a timestamped entry for the merge about 10 minutes ago with a "Restore Pre-Merge State" option.
Clicking that will restore the original records as they were immediately before you confirmed the merge.
Please note this does not undo the merge of other contacts in the same session, only the one you select.
Regarding saving progress — the detection scan results are cached for 2 hours within the same browser session.
However we do not currently persist them across sessions, which I agree is a pain for large datasets like yours.
A workaround is to export the duplicate groups to CSV from the scan results page using the "Export Groups" button.
That gives you a spreadsheet you can work from across multiple sessions without losing your place.`,
  },
  {
    senderType: SenderType.Customer,
    body: `The restore function worked perfectly — I was able to recover the contact data, huge relief!
I have also exported the duplicate groups to CSV as you suggested, very helpful workaround.
I am now about 150 groups through and the end is in sight, which is great progress.
One new issue I want to flag: some contacts that were merged are now showing duplicate tags.
For example a contact that had the tag "VIP" on two records now shows "VIP, VIP" after merging.
It looks like tags are being concatenated rather than deduplicated during the merge process.
This is causing some of our automated workflows to trigger twice for those contacts.
Is there a quick way to clean up duplicate tags across all contacts in bulk?
I could export to CSV and clean it manually but I am hoping there is a faster way within the app.
Additionally, are merged contacts searchable immediately or is there an indexing delay?`,
  },
  {
    senderType: SenderType.Agent,
    body: `Tom, I am glad the restore worked — that is exactly what the history log is there for.
The duplicate tags issue you have described is another known bug introduced in version 4.1.
The tag deduplication logic was accidentally removed during a refactor and has since been fixed.
If you update to version 4.2 or later, any new merges will correctly deduplicate tags automatically.
For the existing contacts that already have duplicate tags, we have a bulk tag cleanup tool.
Go to Settings → Tags → "Find and Remove Duplicates" — it scans all contacts and removes redundant tag entries.
Run it once and it will clean up all instances of tags like "VIP, VIP" across your entire contact list.
Regarding search indexing — merged contacts are indexed immediately for most fields.
However the full-text search index for notes and custom fields has a delay of up to 5 minutes.
If a contact is not appearing in search results right after a merge, wait a few minutes and try again.`,
  },
  {
    senderType: SenderType.Customer,
    body: `I ran the tag cleanup tool and it fixed all the duplicate tags, brilliant feature.
I am happy to report that I have now finished merging all 187 groups successfully.
The whole process took about 3 hours spread across two days which is much better than doing it manually.
However I now notice that my total contact count still seems higher than expected.
Before the merges I had 1,840 contacts and expected to end up with roughly 1,650 after removing duplicates.
But the count is showing 1,743 which suggests about 90 contacts were not caught by the scan.
Is there a way to run a more aggressive scan with lower confidence thresholds to catch the remaining ones?
I suspect some duplicates have slightly different names or use nickname variations like "Bob" vs "Robert".
Also, are there any reports I can run to see which contacts were most recently merged and by whom?
I want to audit the changes before we use this data for our quarterly reports next week.`,
  },
  {
    senderType: SenderType.Agent,
    body: `Hi Tom, congratulations on getting through all 187 groups — that is a significant achievement!
Regarding the remaining duplicates, yes you can absolutely adjust the scan sensitivity.
In the Duplicate Detection settings, change the "Match Confidence" slider from "High" to "Medium" or "Low".
At Medium confidence the scanner will also catch nickname variations like Bob/Robert and common misspellings.
Be aware that lower confidence means more false positives, so review each group carefully before merging.
I recommend running at Medium first and reviewing the new groups — you should catch most of the remaining ones.
For the audit trail, go to Reports → Activity Log → filter by "Action: Contact Merged" and set the date range.
This will show you every merge that happened, who performed it, which records were involved, and the timestamp.
You can export that log to CSV for your records if needed for the quarterly review.
Let me know how the medium-confidence scan goes and whether the count comes down to where you expect it.`,
  },
  {
    senderType: SenderType.Customer,
    body: `I ran the medium-confidence scan and it found an additional 63 groups as you predicted.
Most of them are exactly the kind of nickname variations I suspected — very impressive detection.
I have merged those too and my contact count is now 1,658 which is very close to my estimate.
I downloaded the activity log and it is really comprehensive, exactly what the audit team needed.
One final issue I want to raise before closing this ticket: the merge confirmation emails.
Every time I merged a group, I received a system email notification confirming the merge.
Over two days that added up to 250 emails which completely overwhelmed my inbox.
I did not see an option to disable merge notifications before I started — can this be turned off?
If not, is there at least a way to set up a digest instead of individual emails per merge?
I would like this fixed before any future bulk operations so it does not happen again.`,
  },
  {
    senderType: SenderType.Agent,
    body: `Tom, I sincerely apologise for the email flood — 250 notifications is completely unacceptable.
This is a configuration oversight on our end; bulk operations should never send individual emails by default.
You can disable merge notification emails immediately under Settings → Notifications → "Contact Merge Confirmation".
Toggle that off and you will not receive individual merge emails going forward.
For future bulk operations there is also a "Bulk Operation Mode" toggle at the top of the Duplicate Detection tool.
Enabling it before you start suppresses all individual notifications and sends a single summary email when the job is done.
The summary includes a count of merges performed, any errors, and a downloadable log of all changes.
I am flagging the poor default behaviour internally — bulk mode should be auto-enabled when merging more than 10 groups.
I will personally follow up with our product team to get this changed in a future release.
Again, I apologise for the inconvenience and thank you for your patience throughout this whole process.`,
  },
  {
    senderType: SenderType.Customer,
    body: `Thank you for the explanation and for escalating the notification issue — I appreciate it.
I have turned off the merge notification emails and confirmed the setting saved correctly.
I also tested the Bulk Operation Mode on a small set of remaining cleanup and it works perfectly.
The summary email at the end is much more sensible and gives me everything I need in one place.
Overall the duplicate merging process is now complete and my contact data is in a much better state.
I do want to share some feedback on the experience now that I have been through it end to end.
The 5-contact-per-merge limit is the biggest friction point and should be increased significantly.
The Account Manager custom field bug cost me extra time and I hope the v4.3 fix arrives soon.
The lack of cross-session progress saving also made the process more stressful than it needed to be.
Despite these issues the support from you personally has been excellent throughout this whole ticket.`,
  },
  {
    senderType: SenderType.Agent,
    body: `Tom, thank you so much for taking the time to share such detailed feedback — it is genuinely valuable.
I have compiled all three of your pain points and submitted them as a prioritised feature request bundle.
The 5-contact merge limit increase is already being reviewed by engineering and has your case as supporting evidence.
The Account Manager bug fix in v4.3 is on track for release within the next two weeks.
Cross-session progress persistence for the Duplicate Detection tool has been added to the roadmap for Q3.
I have noted your account as a reference customer for the UX improvements so the team can reach out if they want feedback.
It has been a pleasure working with you on this — you were incredibly thorough in documenting each issue you found.
Is there anything else I can help you with before I mark this ticket as resolved?
I want to make sure your contact data and workflows are all functioning correctly before we close out.
Please feel free to reopen this ticket at any time if anything else comes up related to your contacts.`,
  },
  {
    senderType: SenderType.Customer,
    body: `Everything is working well now and I am happy with the final state of my contact database.
I ran a few of our automated workflows this morning and they are triggering correctly without duplicates.
The quarterly reports are pulling accurate data now that the contact count is correct.
I did notice one very minor thing: two contacts that I merged now show a blank "Created Date" field.
It is not a blocker at all but I wanted to flag it in case it is related to the merge process.
Other than that, everything is in order and I am ready to close this ticket out.
I would give this support experience a 9 out of 10 overall — very thorough and knowledgeable help.
The one point deducted is for the notification email issue which could have been avoided with better defaults.
Please do pass my thanks on to the wider team for building such a capable duplicate detection tool.
I look forward to seeing the improvements you mentioned in future releases.`,
  },
  {
    senderType: SenderType.Agent,
    body: `Tom, thank you for the kind words and for the honest 9 out of 10 rating — fully deserved critique on the emails.
Regarding the blank "Created Date" on two contacts, this is a minor known display issue after certain merges.
To fix it, open each affected contact, click "Edit", and save without making any changes.
That triggers a metadata refresh which restores the Created Date field from the audit log automatically.
It is a cosmetic issue only and does not affect any functionality, reporting, or integrations.
I will add it to the bug list so engineering is aware of the edge case even though it is minor.
I am marking this ticket as Resolved now, but please know you can reopen it any time within the next 30 days.
After 30 days it will move to Closed status, at which point you would need to open a new ticket.
Thank you again for being such a thorough and communicative customer — it made this much easier to resolve.
Wishing you and the team all the best with your quarterly reports and beyond!`,
  },
  {
    senderType: SenderType.Customer,
    body: `The blank Created Date fix worked perfectly — just saved and it populated straight away, thank you.
I want to say one more time that the quality of support I received on this ticket was really outstanding.
Most support tickets I raise with software vendors result in generic responses and long waits.
This felt like working with someone who genuinely understood the product and cared about getting it right.
The fact that you escalated my feedback items and kept me updated at each step made a real difference.
I have already recommended your platform to two colleagues at other companies this week partly because of this experience.
Before we close, could you send me a link to where I can leave a public review of my support experience?
I would be happy to write something up as I think it would be useful for other potential customers to read.
Thanks again for everything Sara — this was a great experience from start to finish.
I will reach out again if anything else comes up, but fingers crossed the data stays clean from here!`,
  },
  {
    senderType: SenderType.Agent,
    body: `Tom, that is incredibly kind of you — comments like yours genuinely make the job worthwhile.
I will pass your feedback along to my manager and the wider support team, they will be delighted to hear it.
You can leave a public review on our profile at G2 or Capterra — both are linked from our website footer.
Alternatively our Trustpilot page is also very active and a great place to share detailed experiences.
Any of those platforms would be fantastic, but please do not feel any obligation — your time is valuable.
I have attached a brief summary of everything we covered in this ticket to your account notes for future reference.
That way if you ever need to do another bulk operation, you or any agent can see the tips and workarounds in one place.
The v4.3 release notes will be emailed to all customers when it ships, so keep an eye out for the Account Manager fix.
It has been a genuine pleasure, Tom — thank you for your patience, thoroughness, and positive attitude throughout.
Take care, and all the best to you and your team!`,
  },
];

async function main() {
  const ticket = await db.ticket.findUnique({ where: { id: TICKET_ID } });
  if (!ticket) {
    console.error(`Ticket ${TICKET_ID} not found.`);
    process.exit(1);
  }

  const now = new Date();
  const data = REPLIES.map((r, i) => ({
    body: r.body,
    senderType: r.senderType,
    authorId: r.senderType === SenderType.Agent ? AGENT_ID : CUSTOMER_ID,
    ticketId: TICKET_ID,
    createdAt: new Date(now.getTime() + i * 10 * 60 * 1000), // 10 min apart
  }));

  const result = await db.reply.createMany({ data });
  console.log(`Created ${result.count} replies for ticket ${TICKET_ID}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
