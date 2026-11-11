# Putting MY GERMAN DÖNER online

This branch (`online/oliver-three-points`) holds only Oliver's priorities: **screen ads** and **shift checklists**. The order time target (point 3) is added later, once DM is ready.

Everything runs on **one server** with Docker: the app, its PostgreSQL database, and Caddy, which gets the HTTPS certificate by itself. Only ports 80 and 443 are open to the internet.

## What you need first

| Item | Example | Notes |
|---|---|---|
| A VPS | Hostinger KVM 2 (2 vCPU, 8 GB RAM), Ubuntu 24.04 | Pick a data centre in Europe |
| A web address | `staff.mygermandoener.com` | A subdomain of your domain is fine |
| Access to the domain's DNS | Hostinger or your registrar panel | To add one A record |
| The GitHub repository | `sagorXO/MYGD` | Branch `online/oliver-three-points` |

## 1. Point the address at the server

In the DNS panel, add an **A record**: name `staff` (or whatever you chose), value = the VPS IP address shown in the Hostinger panel. It can take a few minutes to an hour to work.

## 2. Log in to the server

```bash
ssh root@YOUR_SERVER_IP
```

## 3. Get the code onto the server

The repository is private, so give the server read-only access with a deploy key:

```bash
ssh-keygen -t ed25519 -N "" -f ~/.ssh/github_mygd
cat ~/.ssh/github_mygd.pub
```

Copy the line it prints. On GitHub open the repository, then **Settings → Deploy keys → Add deploy key**, paste it, and leave "Allow write access" **off**. Then:

```bash
printf 'Host github.com\n  IdentityFile ~/.ssh/github_mygd\n' >> ~/.ssh/config
git clone --branch online/oliver-three-points git@github.com:sagorXO/MYGD.git /opt/mygd
cd /opt/mygd
```

## 4. Install

```bash
sudo bash deploy/install.sh
```

It asks for the web address and an email, then installs Docker, turns on the firewall, creates the secrets in `deploy/.env`, builds and starts everything, loads Oliver's checklists and sets up a nightly backup. The first build takes several minutes.

## 5. Create the accounts

```bash
sudo bash deploy/add-user.sh
```

Run it once per person. Choose **1** for Shift Leaders and managers, **2** for staff. Each person types their own 4–8 digit PIN; it never shows on screen.

Also create one **staff account for the tablet** itself. The tablet stays signed in with it, and each person then taps their PIN before ticking tasks.

## 6. Use it

| Who | Open | What for |
|---|---|---|
| Kitchen tablet | `https://ADDRESS/staff/checklists` | Shift checklists, stock count, Shift Leader dashboard |
| Manager | `https://ADDRESS/admin/ads` | Upload ads and choose what each screen plays |
| Each TV | `https://ADDRESS/signage/ads?screen=1` (2, 3 … 6) | Plays that screen's ads, keeps playing if the internet drops |

The TVs need no sign-in. Screens 1–4 are portrait and 5–6 landscape, which you can change in admin.

## Everyday jobs

| Job | Command (in `/opt/mygd`) |
|---|---|
| Install a new version | `sudo bash deploy/update.sh` (takes a backup first) |
| Add a person or reset a PIN | `sudo bash deploy/add-user.sh` |
| See if it is running | `cd deploy && docker compose ps` |
| See recent errors | `cd deploy && docker compose logs app --tail 50` |
| Take a backup now | `sudo bash deploy/backup.sh` |
| Copy backups to your Mac (run on the Mac) | `scp -r root@YOUR_SERVER_IP:/var/backups/mygd ~/mygd-backups` |
| Restore a backup | `sudo bash deploy/restore.sh /var/backups/mygd/db-….dump /var/backups/mygd/media-….tar` |

## Keep safe

- `deploy/.env` holds the database password and session secret. Never share, email or commit it.
- A backup on the same server is not enough. Copy `/var/backups/mygd` off the server at least weekly, and keep Hostinger's own backups switched on.
- If the server is lost, rebuild with steps 3–4, then restore the latest backup.

## If something goes wrong

| What you see | What to do |
|---|---|
| Browser says the site is not secure, or can't connect | The A record is not pointing at the server yet. Check it, wait, then run `cd deploy && docker compose restart caddy` |
| `install.sh` stops with "did not become healthy" | Run `cd deploy && docker compose logs app --tail 50` and read the last lines |
| Someone forgot their PIN | `sudo bash deploy/add-user.sh`, answer **y** to "existing account" |
| A tablet shows "Enter PIN" again and again | Normal: a PIN lapses after 5 minutes without any action |
