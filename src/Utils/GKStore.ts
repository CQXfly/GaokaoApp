export class GKStore {
    private static instance: GKStore;

    public static getInstance(): GKStore {
        if (!GKStore.instance) {
            GKStore.instance = new GKStore();
        }
    
        return GKStore.instance;
    }

    public school: string;

    public major: string;
}