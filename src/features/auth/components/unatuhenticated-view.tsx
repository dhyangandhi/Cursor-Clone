import { ShieldAlertIcon } from "lucide-react";
import {
    Item,
    ItemContent,
    ItemDescription,
    ItemTitle,
    ItemMedia,
    ItemActions,
} from "@/components/ui/item";
import { SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export const UnauthenticatedView = () => {
    return(
        <div className="flex items-center justify-center h-screen">
            <div className="max-w-md p-6 bg-black rounded-lg shadow-md">
                <Item variant="default">
                    <ItemMedia>
                        <ShieldAlertIcon className="w-12 h-12 text-red-500" />
                    </ItemMedia>
                    <ItemContent>
                        <ItemTitle>Unauthorized Access</ItemTitle>
                        <ItemDescription>You do not have permission to view this page.</ItemDescription>
                    </ItemContent>
                    <ItemActions>
                        <SignInButton>
                            <Button variant={"outline"} size="sm">
                                Sign In
                            </Button>
                        </SignInButton>
                    </ItemActions>
                </Item>
            </div>
        </div>
    );
};