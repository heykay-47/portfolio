# Reinterpret homepage visuals for arcade mode

Arcade mode should visibly transform the current homepage viewport into a playable world, but it will use representations of the page's major visual families rather than move its live DOM into the game. Moving live cards, links, and text would couple gameplay to document layout and make reliable restoration, navigation, and accessibility harder. This choice requires keeping the game's visual mapping in step with meaningful homepage changes, while leaving the ordinary page intact and restoring its scroll position and focus on exit.
