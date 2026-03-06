import { FileSystemTree } from "@webcontainer/api"
import { Doc, Id } from "@convex/_generated/dataModel";


type FileDoc = Doc<"files">;

export const BuildFileTree = (files: FileDoc[]): FileSystemTree => {
    const tree: FileSystemTree = {};
    const filesMap = new Map(files.map((f) => [f._id, f]));
    const getpath = (file: FileDoc): string[] => {
        const parts: string[] = [file.name];
        let parentId = file.parentId;

        while (parentId) {
            const parent = filesMap.get(parentId);
            if (!parent) break;
            parts.unshift(parent.name);
            parentId = parent.parentId;
        }
        return parts;
    };

    for (const file of files) {
        const pathParts = getpath(file);
        let current = tree;
        
        for (let i = 0; i < pathParts.length; i++) {
            const path = pathParts[i];
            const isFile = i === pathParts.length - 1;

            if (isFile) {
                if (file.type === "folder") {
                    current[path] = { directory: {} };
                } else if (!file.storageId && file.content !== undefined) {
                    current[path] = { file: { contents: file.content } };
                }
            } else {
                if (!current[path]) {
                    current[path] = { directory: {} };
                }
                const node = current[path];
                if ("directory" in node) {
                    current = node.directory;
                }
            }

        }
    }
    return tree;
}

export const getFilePath = (
    file: FileDoc,
    filesMap: Map<Id<"files">, FileDoc>
): string => {
    const parts: string[] = [file.name];
    let parentId = file.parentId;

    while (parentId) {
        const parent = filesMap.get(parentId);
        if (!parent) break;
        parts.unshift(parent.name);
        parentId = parent.parentId;
    }

    return parts.join("/");
};