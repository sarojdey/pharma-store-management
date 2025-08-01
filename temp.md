const { currentStore } = useStore();

if (!currentStore?.id) {
Alert.alert("Error", "No store selected.");
return;
}

currentStore?.id
