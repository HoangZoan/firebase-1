const FirebaseConfig = require("./FirebaseConfig");
const functions = FirebaseConfig.functions;
const auth = FirebaseConfig.auth;
const firestore = FirebaseConfig.firestore;
const storageBucket = FirebaseConfig.storageBucket;
const admin = FirebaseConfig.admin;

// Choose the place where new data will be stored ("recipes/{recipeId}")
exports.onCreateRecipe = functions
  .region("asia-southeast1")
  .firestore.document("recipes/{recipeId}")
  .onCreate(async (snapshot) => {
    // 'onCreate' is triggered when new data is created on the firestore
    // and get a 'snapshot' contains the new data values

    // Create a way to the doc name "all" in collection "recipeCounts"
    const countDocRef = firestore.collection("recipeCounts").doc("all");
    const countDoc = await countDocRef.get();

    if (countDoc.exists) {
      countDocRef.update({ count: admin.firestore.FieldValue.increment(1) });
    } else {
      countDocRef.set({ count: 1 });
    }

    const recipe = snapshot.data();

    // Set up functions to count datas those have the same specific value
    // when each new data will be added
    if (recipe.isPublished) {
      const countPublishedDocRef = firestore
        .collection("recipeCounts")
        .doc("Published");
      const countPublishedDoc = await countPublishedDocRef.get();

      if (countPublishedDoc.exists) {
        countPublishedDocRef.update({
          count: admin.firestore.FieldValue.increment(1),
        });
      } else {
        countPublishedDocRef.set({ count: 1 });
      }
    }
  });

exports.onUpdateRecipe = functions
  .region("asia-southeast1")
  .firestore.document("recipes/{recipeId}")
  .onUpdate(async (changes) => {
    const oldRecipe = changes.before.data();
    const newRecipe = changes.after.data();

    let publishCount = 0;

    if (!oldRecipe.isPublished && newRecipe.isPublished) {
      publishCount += 1;
    } else if (oldRecipe.isPublished && !newRecipe.isPublished) {
      publishCount -= 1;
    }

    if (publishCount !== 0) {
      const publishedCountDocRef = firestore
        .collection("recipeCounts")
        .doc("Published");

      const publishCountDoc = await publishedCountDocRef.get();

      if (publishCountDoc.exists) {
        publishedCountDocRef.update({
          count: admin.firestore.FieldValue.increment(publishCount),
        });
      } else {
        if (publishCount > 0) {
          publishedCountDocRef.set({ count: publishCount });
        } else {
          publishedCountDocRef.set({ count: 0 });
        }
      }
    }
  });

exports.onDeleteRecipe = functions
  .region("asia-southeast1")
  .firestore.document("recipes/{recipeId}")
  .onDelete(async (snapshot) => {
    const recipe = snapshot.data();
    const imageUrl = recipe.imageUrl;

    if (imageUrl) {
      const decodedUrl = decodeURIComponent(imageUrl);
      const startIndex = decodedUrl.indexOf("/o/") + 3;
      const endIndex = decodedUrl.indexOf("?");
      const fullFilePath = decodedUrl.substring(startIndex, endIndex);
      const file = storageBucket.file(fullFilePath);

      console.log(`Attempting to delete: ${fullFilePath}`);

      try {
        await file.delete();
        console.log("Successfully deleleted image.");
      } catch (error) {
        console.log(`Failed to delete file: ${error.message}`);
      }

      const countDocRef = firestore.collection("recipeCounts").doc("all");
      const countDoc = await countDocRef.get();

      if (countDoc.exists) {
        countDocRef.update({ count: admin.firestore.FieldValue.increment(-1) });
      } else {
        countDocRef.set({ count: 0 });
      }

      if (recipe.isPublished) {
        const countPublishedDocRef = firestore
          .collection("recipeCounts")
          .doc("Published");
        const countPublishedDoc = await countPublishedDocRef.get();

        if (countPublishedDoc.exists) {
          countPublishedDocRef.update({
            count: admin.firestore.FieldValue.increment(-1),
          });
        } else {
          countPublishedDocRef.set({ count: 0 });
        }
      }
    }
  });
