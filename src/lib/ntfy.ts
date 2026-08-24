const NTFY_TOPIC = "nexus-alert-for-ord-and-chat-pk-livep";

export async function sendNtfyNotification(title: string, message: string) {
  const payload = { title, message, priority: "high", tags: ["bell", "nexus"] };

  try {
    const response = await fetch(`https://ntfy.sh/${NTFY_TOPIC}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Title": title,
        "Priority": "high",
        "Tags": "bell,nexus",
      },
      body: JSON.stringify(payload),
    });
    return response.ok;
  } catch (error) {
    console.warn("Direct ntfy notification failed:", error);
    return false;
  }
}
