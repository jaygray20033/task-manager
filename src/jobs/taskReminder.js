const Task = require("../models/task");
const User = require("../models/user");
const { sendTaskReminderEmail } = require("../emails/account");

const checkTaskReminders = async () => {
  try {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    console.log(
      `\n[Task Reminder] ⏰ Checking tasks at ${now.toLocaleString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
      })}`
    );
    console.log(`[Task Reminder] Looking for tasks due between:`);
    console.log(`  From: ${now.toISOString()}`);
    console.log(`  To:   ${oneHourLater.toISOString()}`);

    const allTasks = await Task.find({
      completed: false,
      dueDate: { $exists: true, $ne: null },
    }).populate("owner");

    console.log(
      `[Task Reminder] Total incomplete tasks with dueDate: ${allTasks.length}`
    );

    const tasksToRemind = allTasks.filter((task) => {
      const taskDueDate = new Date(task.dueDate);
      const timeDiff = taskDueDate - now;
      const hoursDiff = timeDiff / (1000 * 60 * 60);

      // Task sắp đến hạn trong vòng 1 giờ tới và chưa gửi reminder
      return hoursDiff > 0 && hoursDiff <= 1 && !task.reminderSent;
    });

    console.log(
      `[Task Reminder] Found ${tasksToRemind.length} task(s) to remind`
    );

    if (tasksToRemind.length > 0) {
      tasksToRemind.forEach((task, index) => {
        const taskDueDate = new Date(task.dueDate);
        const timeDiff = taskDueDate - now;
        const minutesDiff = Math.round(timeDiff / (1000 * 60));
        console.log(
          `  ${index + 1}. "${
            task.description
          }" - Due in ${minutesDiff} minutes - Owner: ${task.owner.email}`
        );
      });
    }

    for (const task of tasksToRemind) {
      try {
        const dueDateLocal = new Date(task.dueDate).toLocaleString("vi-VN", {
          timeZone: "Asia/Ho_Chi_Minh",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });

        console.log(
          `[Task Reminder] 📧 Sending reminder for task: "${task.description}"`
        );

        await sendTaskReminderEmail(
          task.owner.email,
          task.owner.name,
          task.description,
          dueDateLocal,
          task.category || "Chung"
        );

        task.reminderSent = true;
        await task.save();

        console.log(
          `[Task Reminder] ✅ Successfully sent reminder for task ${task._id}`
        );
      } catch (error) {
        console.error(
          `[Task Reminder] ❌ Failed to send reminder for task ${task._id}:`,
          error.message
        );
      }
    }

    console.log(`[Task Reminder] Check complete\n`);
  } catch (error) {
    console.error("[Task Reminder] ❌ Error checking task reminders:", error);
  }
};

const startTaskReminderJob = () => {
  console.log(
    "[Task Reminder] 🚀 Starting task reminder job (runs every 10 minutes)"
  );

  checkTaskReminders();

  setInterval(checkTaskReminders, 10 * 60 * 1000);
};

module.exports = { startTaskReminderJob, checkTaskReminders };
