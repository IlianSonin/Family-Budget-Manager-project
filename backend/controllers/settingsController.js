const UserSettings = require("../models/UserSettings");

// Get user settings
exports.getUserSettings = async (req, res) => {
  try {
    let settings = await UserSettings.findOne({ userId: req.userId });

    // If no settings exist, create default settings
    if (!settings) {
      settings = await UserSettings.create({
        userId: req.userId,
      });
    }

    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update user settings
exports.updateUserSettings = async (req, res) => {
  const { theme, layout, components } = req.body;

  try {
    let settings = await UserSettings.findOne({ userId: req.userId });

    if (!settings) {
      settings = new UserSettings({ userId: req.userId });
    }

    // Update theme settings
    if (theme) {
      if (theme.primaryColor) settings.theme.primaryColor = theme.primaryColor;
      if (theme.secondaryColor)
        settings.theme.secondaryColor = theme.secondaryColor;
      if (theme.accentColor) settings.theme.accentColor = theme.accentColor;
      if (theme.backgroundGradient) {
        if (theme.backgroundGradient.start)
          settings.theme.backgroundGradient.start =
            theme.backgroundGradient.start;
        if (theme.backgroundGradient.end)
          settings.theme.backgroundGradient.end = theme.backgroundGradient.end;
        if (theme.backgroundGradient.direction)
          settings.theme.backgroundGradient.direction =
            theme.backgroundGradient.direction;
      }
    }

    // Update layout settings
    if (layout) {
      if (typeof layout.showFamilyMembers === "boolean")
        settings.layout.showFamilyMembers = layout.showFamilyMembers;
      if (typeof layout.showShoppingList === "boolean")
        settings.layout.showShoppingList = layout.showShoppingList;
      if (typeof layout.showIncomeExpenses === "boolean")
        settings.layout.showIncomeExpenses = layout.showIncomeExpenses;
      if (layout.dashboardOrder)
        settings.layout.dashboardOrder = layout.dashboardOrder;
    }

    // Update component settings
    if (components) {
      if (components.familyCard) {
        if (components.familyCard.background)
          settings.components.familyCard.background =
            components.familyCard.background;
        if (components.familyCard.borderRadius)
          settings.components.familyCard.borderRadius =
            components.familyCard.borderRadius;
        if (components.familyCard.shadow)
          settings.components.familyCard.shadow = components.familyCard.shadow;
      }
      if (components.budgetCard) {
        if (components.budgetCard.background)
          settings.components.budgetCard.background =
            components.budgetCard.background;
        if (components.budgetCard.borderRadius)
          settings.components.budgetCard.borderRadius =
            components.budgetCard.borderRadius;
        if (components.budgetCard.shadow)
          settings.components.budgetCard.shadow = components.budgetCard.shadow;
      }
      if (components.shoppingCard) {
        if (components.shoppingCard.background)
          settings.components.shoppingCard.background =
            components.shoppingCard.background;
        if (components.shoppingCard.borderRadius)
          settings.components.shoppingCard.borderRadius =
            components.shoppingCard.borderRadius;
        if (components.shoppingCard.shadow)
          settings.components.shoppingCard.shadow =
            components.shoppingCard.shadow;
      }
      if (components.recentActionsCard) {
        if (components.recentActionsCard.background)
          settings.components.recentActionsCard.background =
            components.recentActionsCard.background;
        if (components.recentActionsCard.borderRadius)
          settings.components.recentActionsCard.borderRadius =
            components.recentActionsCard.borderRadius;
        if (components.recentActionsCard.shadow)
          settings.components.recentActionsCard.shadow =
            components.recentActionsCard.shadow;
      }
    }

    await settings.save();
    res.json({ message: "Settings updated successfully", settings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Reset user settings to default
exports.resetUserSettings = async (req, res) => {
  try {
    await UserSettings.findOneAndDelete({ userId: req.userId });

    // Create new default settings
    const defaultSettings = await UserSettings.create({
      userId: req.userId,
    });

    res.json({
      message: "Settings reset to default",
      settings: defaultSettings,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
