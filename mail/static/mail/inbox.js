document.addEventListener("DOMContentLoaded", function () {
  // Use buttons to toggle between views
  document
    .querySelector("#inbox")
    .addEventListener("click", () => load_mailbox("inbox"));
  document
    .querySelector("#sent")
    .addEventListener("click", () => load_mailbox("sent"));
  document
    .querySelector("#archived")
    .addEventListener("click", () => load_mailbox("archive"));
  document.querySelector("#compose").addEventListener("click", compose_email);

  // By default, load the inbox
  load_mailbox("inbox");
});

function compose_email() {
  // Show compose view and hide other views
  document.querySelector("#email").style.display = "none";
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "block";

  // Clear out composition fields
  document.querySelector("#compose-recipients").value = "";
  document.querySelector("#compose-subject").value = "";
  document.querySelector("#compose-body").value = "";

  const submitButton = document.querySelector(
    "input[type=submit].btn.btn-primary"
  );
  submitButton.value = `Send`;

  document.querySelector("#compose-form").onsubmit = send_email;
}

function reply_email(email) {
  // Show compose view and hide other views
  document.querySelector("#email").style.display = "none";
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "block";

  const current_user = document.querySelectorAll(".form-control")[0].value;
  const recipients = document.querySelector("#compose-recipients");
  const subject = document.querySelector("#compose-subject");
  const body = document.querySelector("#compose-body");

  // Pre-fill the composition form with the recipient field set to whoever sent the original email.
  if (current_user === email.sender) {
    recipients.value = email.recipients;
  } else {
    recipients.value = email.sender;
  }

  // Pre-fill the subject line
  email.subject.slice(0, 3) === "Re:"
    ? (subject.value = email.subject)
    : (subject.value = "Re: " + email.subject);

  // Pre-fill the body of the email with a line like "On Jan 1 2020, 12:00 AM foo@example.com wrote:"
  // followed by the original text of the email.
  body.innerText = "";
  body.value = `On ${email.timestamp} ${email.sender} wrote:
  
${email.body}`;

  document.querySelector("#compose-form").onsubmit = send_email;
}

function archive_unarchive(id, mailbox) {
  const is_archived = mailbox === "archive";

  fetch(`/emails/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      archived: !is_archived,
    }),
  })
    .then((response) => {
      let status = "";
      response.ok
        ? (status = `Email ${
            is_archived ? "unarchived" : "archived"
          } succesfully`)
        : (status = "Failed archiving email");
      console.log(response.status + ": " + status);
    })
    .then(() => {
      load_mailbox("inbox");
    });
}

function view_email(id, mailbox) {
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "none";
  document.querySelector("#email").style.display = "block";
  const user_email = document.querySelector("h2").innerText;
  let get_email = "";

  // make the email read
  fetch(`/emails/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      read: true,
    }),
  }).then((response) => {
    let status = "";
    response.ok
      ? (status = `Email read succesfully`)
      : (status = "Failed reading email");
    console.log(response.status + ": " + status);
  });

  // get existing email
  fetch(`/emails/${id}`)
    .then((response) => response.json())
    .then((email) => {
      console.log(email);
      get_email = email;

      const isnot_sentmailbox = mailbox !== "sent";
      const archive_div = `<button class="fs-5 button border-0 rounded px-4 py-2 fw-normal" id="archive">
      <i class="fa-solid fa-box-archive me-1"></i> ${
        mailbox === "archive" ? "unarchive" : "archive"
      }
      </button>`;

      const box = document.createElement("div");
      box.innerHTML = `<div class="py-3 d-flex justify-content-between">     
        <button class="fs-5 border-0 bg-transparent p-0"><i class="fa-solid fa-arrow-left cursor-pointer" id="go-back"></i></button>     
        ${isnot_sentmailbox ? archive_div : ""}
        </div>
        <div class="py-2">
          <h3 class="display-6 pt-3 pb-4">${email.subject}</h3>
          <div class="">
            <div class="d-flex justify-content-between">
              <p class="fs-4 mb-0">${email.sender}</p>
              <span class="fs-5 text-muted">${email.timestamp}</span>
            </div>
            <span class="fs-5 text-muted">to:
              ${email.recipients
                .map((r) => {
                  if (r == user_email) return "me";
                  console.log(r, user_email);
                  return r;
                })
                .join(", ")}
            </span>
          </div>
          <div class="py-4 mb-5">
            <p class="py-4 fs-4 m-0">${email.body}</p>
          </div>
          <div class="border-top py-3">
            <button class="button border-0 rounded fs-5 px-4 py-2 fw-normal" id="reply">
              <i class="fa-solid fa-reply me-1"></i> Reply
            </button>
          </div>
        </div>
      `;

      const displayed_email = document.querySelector("#email");
      if (displayed_email.childElementCount > 0) {
        while (displayed_email.firstChild) {
          displayed_email.removeChild(displayed_email.firstChild);
        }
      }
      displayed_email.append(box);
    })
    .then(() => {
      try {
        if (mailbox !== "sent") {
          document
            .querySelector("#archive")
            .addEventListener("click", () => archive_unarchive(id, mailbox));
        }
        document
          .querySelector("#go-back")
          .addEventListener("click", () => load_mailbox(mailbox));
        document
          .querySelector("#reply")
          .addEventListener("click", () => reply_email(get_email));
      } catch (error) {
        console.error(error);
      }
    });
}

function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector("#emails-view").style.display = "block";
  document.querySelector("#compose-view").style.display = "none";
  document.querySelector("#email").style.display = "none";

  // Show the mailbox name
  document.querySelector("#emails-view").innerHTML = `<h3 class="mt-2 py-3">${
    mailbox.charAt(0).toUpperCase() + mailbox.slice(1)
  }</h3>`;

  fetch(`/emails/${mailbox}`)
    .then((response) => response.json())
    .then((emails) => {
      // Print emails
      console.log(emails);

      emails.forEach((email) => {
        const box = document.createElement("div");
        box.classList.add("list-group", "my-2");
        box.role = "button";
        box.innerHTML =
          // recipient, subject, timestamp
          `<div class="list-group-item ${
            email.read ? "list-group-item-light" : ""
          }">
            <div class="d-flex justify-content-between">
              <p class="fs-4 fw-normal ${email.read ? "" : "fw-medium"} m-0">${
            email.sender
          }</p>
              <span class="fs-5 text-black-50">${email.timestamp}</span>
            </div>
            <p class="fs-5 m-0 flex-grow-1">${email.subject}</p>
          </div>`;
        box.addEventListener("click", () => view_email(email.id, mailbox));
        document.querySelector("#emails-view").append(box);
      });
    });
}

function send_email(event) {
  event.preventDefault();

  const get_recipients = document.querySelector("#compose-recipients").value;
  const get_subject = document.querySelector("#compose-subject").value;
  const get_body = document.querySelector("#compose-body").value;

  fetch("/emails", {
    method: "POST",
    body: JSON.stringify({
      recipients: get_recipients,
      subject: get_subject,
      body: get_body,
    }),
  })
    .then((response) => {
      let status = "";
      response.ok
        ? (status = "Email sent succesfully")
        : (status = "Failed sending email");
      console.log(response.status + ": " + status);
      response.json();
    })
    .then(() => {
      load_mailbox("sent");
    });
}
