import { LevelEntityStore } from "../storage/level/levelEntityStore";

export async function main() {
  const entityStore = await LevelEntityStore.open();

  for await (const [key, value] of entityStore.level.iterator()) {
    if (key === "entity|Address|0x5e349eca2dc61aBCd9dD99Ce94d04136151a09Ee") {
      console.log({ abc: value });
    }
  }

  console.log(
    await entityStore.level.get(
      "entity|Address|0x5e349eca2dc61aBCd9dD99Ce94d04136151a09Ee"
    )
  );

  console.log(
    await entityStore.getEntity(
      "Address",
      "0x5e349eca2dc61aBCd9dD99Ce94d04136151a09Ee"
    )
  );
}

main();
